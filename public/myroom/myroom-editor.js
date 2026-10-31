/**
 * 마이룸 미니 에디터
 * - 드래그 이동 / 리사이즈 / 회전 / Z순서 / 잠금 / 저장
 * - 서버와는 ajax(JSON)로만 통신. 서버 스택 의존 없음(vanilla JS)
 */
(function (global) {
  'use strict';

  // 겹침 우선도(Z순서)의 상한/하한. 맨 앞으로 가도 999를 넘지 않고, 맨 뒤로 가도 -50 밑으로 내려가지 않는다.
  var MYROOM_Z_MAX = 999;
  var MYROOM_Z_MIN = -50;
  function myroomClampZ(z) {
    return Math.max(MYROOM_Z_MIN, Math.min(MYROOM_Z_MAX, z));
  }

  function MyRoomEditor(opts) {
    // opts: { canvasEl, wrId, boTable, saveUrl, uploadUrl, items, canvasW, canvasH, editable, csrfToken }
    this.canvasEl = opts.canvasEl;
    // O.home 이식: 서버 통신은 host(React)가 넘겨 주는 콜백으로 대신한다
    //   hooks.uploadImage(file) -> Promise<{url,w,h}>   hooks.uploadSound(file) -> Promise<{url}>
    //   hooks.save(data, title) -> Promise<void>
    this.hooks = opts.hooks || {};
    this._docHandlers = [];
    this.canvasW = opts.canvasW || 800;
    this.canvasH = opts.canvasH || 600;
    this.editable = !!opts.editable;
    this.roomTitle = opts.title || ''; // 저장 시 함께 갱신할 방 이름(값이 있을 때만 서버에서 반영)
    this.gridSize = opts.gridSize || 10;
    this.snapEnabled = opts.snapEnabled !== false; // 기본 on
    this.viewScale = 1; // 모바일 등 좁은 화면에서 방 전체를 축소해서 보여주기 위한 배율
    this.panX = 0;
    this.panY = 0;
    this.spaceDown = false; // 스페이스바를 누르고 있는 동안은 아이템 대신 화면 자체를 드래그로 이동(핸드 툴)

    this.items = (opts.items || []).map(function (it) { return Object.assign({}, it); });
    this.selectedId = null;
    this.nextZ = this._maxZ() + 1;

    // Ctrl+Z 실행 취소용 히스토리 스택 (변경 직전 상태의 스냅샷을 저장)
    this.history = [];
    this.historyLimit = 50;

    this._dragState = null; // { type: 'move'|'resize'|'rotate', itemId, startX, startY, orig }
    this._groupDragState = null; // 여러 아이템을 한꺼번에 옮길 때(선택 이동) 사용
    this._itemEls = {}; // id -> 렌더링된 DOM 엘리먼트 (드래그 중 재렌더 없이 직접 갱신하기 위함)

    // 다중 선택(선택 삭제/복사/이동)
    this.multiSelectMode = false; // false | 'picking'(고를 때) | 'moving'(같이 드래그해서 옮길 때)
    this.multiSelectIds = [];

    this._bindGlobalEvents();
    this._bindUndoShortcut();
    this.render();
  }

  MyRoomEditor.prototype._maxZ = function () {
    return this.items.reduce(function (m, it) { return Math.max(m, it.z || 0); }, 0);
  };

  MyRoomEditor.prototype._uid = function () {
    return 'item_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  };

  // ---------- 편집 모드 전환 (홈 편집 시작/종료) ----------
  MyRoomEditor.prototype.setEditable = function (val) {
    this.editable = !!val;
    if (!this.editable) this.selectedId = null;
    this.render();
  };

  // ---------- 실행 취소 (Ctrl+Z) ----------
  MyRoomEditor.prototype._snapshot = function () {
    // items 배열의 깊은 복사본(및 selectedId)을 하나의 스냅샷으로 저장
    return {
      items: JSON.parse(JSON.stringify(this.items)),
      nextZ: this.nextZ,
      selectedId: this.selectedId
    };
  };

  MyRoomEditor.prototype._pushHistory = function () {
    this.history.push(this._snapshot());
    if (this.history.length > this.historyLimit) this.history.shift();
  };

  MyRoomEditor.prototype.undo = function () {
    if (!this.history.length) return false;
    var snap = this.history.pop();
    this.items = snap.items;
    this.nextZ = snap.nextZ;
    this.selectedId = snap.selectedId;
    this.render();
    if (this.onSelect) this.onSelect(this.getItem(this.selectedId));
    return true;
  };

  // 문서 전체에 거는 이벤트는 여기로 모아 두었다가, 페이지를 떠날 때 destroy()로 한꺼번에 푼다
  MyRoomEditor.prototype._docOn = function (type, fn, opts) {
    document.addEventListener(type, fn, opts);
    this._docHandlers.push([type, fn, opts]);
  };

  MyRoomEditor.prototype.destroy = function () {
    this._docHandlers.forEach(function (h) { document.removeEventListener(h[0], h[1], h[2]); });
    this._docHandlers = [];
    if (this._ctxOutsideHandler) {
      document.removeEventListener('mousedown', this._ctxOutsideHandler, true);
      document.removeEventListener('touchstart', this._ctxOutsideHandler, true);
    }
    this._dead = true;
  };

  MyRoomEditor.prototype._bindUndoShortcut = function () {
    var self = this;
    self._docOn('keydown', function (e) {
      if (!self.editable) return;
      var tag = e.target && e.target.tagName;
      // 입력창에 포커스가 있을 때는 텍스트 편집(백스페이스/실행취소 등)을 그대로 두고, 캔버스 단축키는 건너뜀
      var isTyping = (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target && e.target.isContentEditable));

      var isUndoCombo = (e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'z' || e.key === 'Z');
      if (isUndoCombo) {
        if (isTyping) return;
        e.preventDefault();
        self.undo();
        return;
      }

      // Delete/Backspace로 선택된 아이템(또는 다중 선택된 아이템들) 삭제
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (isTyping) return;
        if (self.multiSelectMode === 'picking' && self.multiSelectIds.length) {
          e.preventDefault();
          self.deleteMultiSelected();
          return;
        }
        if (!self.selectedId) return;
        var it = self.getItem(self.selectedId);
        if (!it || it.posLocked) return; // 위치 고정된 아이템은 실수 삭제 방지
        e.preventDefault();
        self.removeItem(self.selectedId);
      }

      // Ctrl+] : 한 칸 앞으로, Ctrl+[ : 한 칸 뒤로
      // Ctrl+Shift+] : 맨 앞으로, Ctrl+Shift+[ : 맨 뒤로 (선택된 아이템 하나에 대해서만 동작)
      // Shift가 눌리면 e.key가 '['/']' 대신 '{'/'}' 로 바뀌어버리므로, 키보드 배열에 영향받지 않는
      // e.code(물리적 키 위치: BracketLeft/BracketRight)로 판정한다.
      if ((e.ctrlKey || e.metaKey) && (e.code === 'BracketLeft' || e.code === 'BracketRight')) {
        if (isTyping) return;
        if (!self.selectedId) return;
        var zIt = self.getItem(self.selectedId);
        if (!zIt) return;
        e.preventDefault();
        if (e.code === 'BracketRight') {
          if (e.shiftKey) self.bringToFront(self.selectedId);
          else self.moveForward(self.selectedId);
        } else {
          if (e.shiftKey) self.sendToBack(self.selectedId);
          else self.moveBackward(self.selectedId);
        }
      }
    });

    // 스페이스바를 누르고 있는 동안: 아이템을 클릭/드래그해도 선택되지 않고 화면(캔버스) 자체를 끌어서 이동
    self._docOn('keydown', function (e) {
      if (!self.editable) return;
      if (e.code !== 'Space') return;
      var tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target && e.target.isContentEditable)) return;
      if (self.spaceDown) return; // 키를 누르고 있는 동안 반복 발생하는 keydown 무시
      self.spaceDown = true;
      self.canvasEl.parentNode && self.canvasEl.parentNode.classList.add('mr-pan-mode');
      e.preventDefault();
    });
    self._docOn('keyup', function (e) {
      if (e.code !== 'Space') return;
      self.spaceDown = false;
      self.canvasEl.parentNode && self.canvasEl.parentNode.classList.remove('mr-pan-mode');
    });
  };

  // ---------- 렌더링 ----------
  MyRoomEditor.prototype.render = function () {
    var self = this;
    this.canvasEl.style.width = this.canvasW + 'px';
    this.canvasEl.style.height = this.canvasH + 'px';
    this.canvasEl.style.transformOrigin = 'top left';
    this.canvasEl.style.transform = this._panScaleTransform();
    this.canvasEl.classList.toggle('mr-show-center', this.editable);
    this._updateGridBackground();
    this.canvasEl.innerHTML = '';
    this._itemEls = {};

    this.items
      .slice()
      .sort(function (a, b) { return (a.z || 0) - (b.z || 0); })
      .forEach(function (it) { self._renderItem(it); });
  };

  // 패닝(화면 이동) 오프셋과 배율(scale)을 합친 transform 문자열
  MyRoomEditor.prototype._panScaleTransform = function () {
    var t = 'translate(' + this.panX + 'px, ' + this.panY + 'px)';
    if (this.viewScale !== 1) t += ' scale(' + this.viewScale + ')';
    return t;
  };

  // 좁은 화면에서 방을 통째로 축소해 보여줄 때 호출 (드래그/리사이즈 좌표 계산도 이 배율을 반영함)
  MyRoomEditor.prototype.setViewScale = function (scale) {
    this.viewScale = (scale > 0) ? scale : 1;
    this.render();
  };

  // setViewScale과 달리 아이템 DOM을 다시 그리지 않고 transform(scale)만 갱신한다.
  // 휠/슬라이더로 배율을 연속적으로 바꿀 때(짧은 시간에 여러 번 호출) 매번 전체를 다시 그리면
  // 무거우므로, 그럴 때는 이 가벼운 버전을 쓴다. 드래그/리사이즈 좌표 계산에 쓰이는
  // viewScale 값 자체는 setViewScale과 동일하게 갱신된다.
  MyRoomEditor.prototype.setViewScaleLight = function (scale) {
    this.viewScale = (scale > 0) ? scale : 1;
    this.canvasEl.style.transform = this._panScaleTransform();
  };

  // 캔버스(방) 자체의 가로/세로 크기를 바꾼다. 아이템 위치는 그대로 두고 캔버스 크기만 조절되며,
  // 실제 서버 반영은 저장(save) 시 canvas_w/canvas_h 값으로 함께 전송된다.
  MyRoomEditor.prototype.setCanvasSize = function (w, h) {
    w = Math.max(100, Math.min(4000, parseInt(w, 10) || this.canvasW));
    h = Math.max(100, Math.min(4000, parseInt(h, 10) || this.canvasH));
    this.canvasW = w;
    this.canvasH = h;
    this.render();
  };

  MyRoomEditor.prototype._updateGridBackground = function () {
    // 스냅은 동작하되, 격자선은 화면에 표시하지 않음
    this.canvasEl.style.backgroundImage = 'none';
  };

  MyRoomEditor.prototype.toggleSnap = function () {
    this.snapEnabled = !this.snapEnabled;
    this.render();
  };

  MyRoomEditor.prototype.setGridSize = function (size) {
    this.gridSize = Math.max(4, size);
    this.render();
  };

  MyRoomEditor.prototype._snap = function (val) {
    if (!this.snapEnabled) return val;
    var g = this.gridSize;
    return Math.round(val / g) * g;
  };

  // ---------- 아이템이 캔버스(화면) 밖으로 나가지 않도록 위치 보정 ----------
  // ---------- 아이템이 캔버스(화면) 밖으로 나가지 않도록 위치 보정 ----------
  MyRoomEditor.prototype._clampPosition = function (it) {
    if (!it) return;
    // 아이템이 캔버스보다 큰 축은 애초에 캔버스 안에 완전히 들어올 수 없으므로
    // (구석으로 강제로 밀어붙이면 한쪽만 잘려서 어색해 보임) 위치를 건드리지 않고
    // 캔버스보다 작거나 같은 축만 캔버스 범위 안으로 보정한다.
    if (it.w <= this.canvasW) {
      var maxX = this.canvasW - it.w;
      if (it.x < 0) it.x = 0;
      if (it.x > maxX) it.x = maxX;
    }
    if (it.h <= this.canvasH) {
      var maxY = this.canvasH - it.h;
      if (it.y < 0) it.y = 0;
      if (it.y > maxY) it.y = maxY;
    }
  };

  MyRoomEditor.prototype._clampSize = function (it) {
    if (!it) return;
    var maxW = Math.max(this.gridSize, this.canvasW - it.x);
    var maxH = Math.max(this.gridSize, this.canvasH - it.y);
    if (it.w > maxW) it.w = maxW;
    if (it.h > maxH) it.h = maxH;
  };

  MyRoomEditor.prototype._renderItem = function (it) {
    var self = this;
    var wrap = document.createElement('div');
    var isMultiPicked = this.multiSelectMode && this.multiSelectIds.indexOf(it.id) !== -1;
    wrap.className = 'mr-item' + (it.id === this.selectedId ? ' mr-selected' : '') + (it.posLocked && this.editable ? ' mr-locked' : '') +
      (isMultiPicked ? ' mr-multiselected' : '') + (this.multiSelectMode === 'picking' ? ' mr-multiselect-pickable' : '');
    wrap.dataset.id = it.id;
    this._itemEls[it.id] = wrap;
    wrap.style.left = it.x + 'px';
    wrap.style.top = it.y + 'px';
    wrap.style.width = it.w + 'px';
    wrap.style.height = it.h + 'px';
    wrap.style.zIndex = it.z || 1;
    wrap.style.transform = 'rotate(' + (it.rot || 0) + 'deg)' + (it.flip ? ' scaleX(-1)' : '');
    wrap.style.opacity = (it.opacity != null ? it.opacity : 1);

    var img = document.createElement('img');
    img.src = it.src;
    img.draggable = false;
    wrap.appendChild(img);

    if (it.type === 'text') {
      wrap.classList.add('mr-text');
      var span = document.createElement('div');
      span.className = 'mr-text-content';
      span.contentEditable = false;
      span.textContent = it.text || '텍스트';
      wrap.appendChild(span);
      img.remove();
    }

    // 클릭 액션(사운드): 편집 모드/일반 보기 모드 모두에서 동작. 드래그 직후 클릭은 무시.
    wrap.addEventListener('click', function () {
      if (self._lastDragMoved) return;
      if (self.multiSelectMode) return;
      if (it.clickAction === 'sound' && it.soundUrl) {
        var audio = new Audio(it.soundUrl);
        audio.play().catch(function () {});
      }
    });

    if (this.editable) {
      wrap.addEventListener('mousedown', function (e) {
        if (self.spaceDown) { e.preventDefault(); self._startPan(e.clientX, e.clientY); return; }
        if (self.multiSelectMode === 'picking') {
          e.stopPropagation();
          // 위치 고정된 아이템은 이동 없이 바로 선택 토글, 그 외에는 드래그하면 이동/그냥 클릭하면 선택 토글
          if (it.posLocked) { self.toggleMultiSelect(it.id); return; }
          self._startPickModeDrag(e, it.id);
          return;
        }
        if (self.multiSelectMode === 'moving' && self.multiSelectIds.indexOf(it.id) !== -1) {
          self._startGroupDrag(e);
          return;
        }
        if (it.posLocked) { self.select(it.id); return; }
        self._startDrag(e, it.id, 'move');
      });
      wrap.addEventListener('touchstart', function (e) {
        var touch = e.touches[0];
        if (!touch) return;

        // 팬 모드(스페이스바 또는 모바일의 "이동" 버튼): 아이템을 무시하고 화면 자체를 끌어서 이동
        if (self.spaceDown) { e.preventDefault(); self._startPan(touch.clientX, touch.clientY); return; }

        // 모바일 꾹 누르기(롱프레스) → PC 우클릭과 동일하게 컨텍스트 메뉴를 연다.
        var startX = touch.clientX, startY = touch.clientY;
        var longPressFired = false;
        var longPressTimer = setTimeout(function () {
          longPressTimer = null;
          var moved = !!((self._dragState && self._dragState.moved) || (self._groupDragState && self._groupDragState.moved));
          if (moved) return;
          longPressFired = true;
          // 진행 중이던 이동/드래그 상태는 취소하고 컨텍스트 메뉴로 대체한다.
          self._dragState = null;
          self._groupDragState = null;
          self._lastDragMoved = false;
          if (window.navigator && window.navigator.vibrate) { try { window.navigator.vibrate(15); } catch (err) {} }
          self.select(it.id);
          self._openContextMenu(startX, startY, it.id);
        }, 500);

        function clearLongPress() {
          if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
          document.removeEventListener('touchmove', onTouchMoveCheck);
          document.removeEventListener('touchend', onTouchEndCheck);
          document.removeEventListener('touchcancel', onTouchEndCheck);
        }
        function onTouchMoveCheck(ev) {
          var t = ev.touches[0];
          if (!t) return;
          if (Math.abs(t.clientX - startX) > 10 || Math.abs(t.clientY - startY) > 10) {
            clearLongPress();
          }
        }
        function onTouchEndCheck(ev) {
          if (longPressFired) {
            // 롱프레스로 메뉴가 열렸다면 뒤이어 발생하는 합성 클릭을 막는다(사운드 재생 등 오작동 방지).
            ev.preventDefault();
          }
          clearLongPress();
        }
        document.addEventListener('touchmove', onTouchMoveCheck, { passive: true });
        document.addEventListener('touchend', onTouchEndCheck);
        document.addEventListener('touchcancel', onTouchEndCheck);

        if (self.multiSelectMode === 'picking') {
          e.preventDefault();
          if (it.posLocked) { self.toggleMultiSelect(it.id); return; }
          self._startPickModeDrag(touch, it.id, e);
          return;
        }
        if (self.multiSelectMode === 'moving' && self.multiSelectIds.indexOf(it.id) !== -1) {
          self._startGroupDrag(touch, e);
          return;
        }
        if (it.posLocked) { self.select(it.id); return; }
        self._startDrag(touch, it.id, 'move', e);
      }, { passive: false });

      wrap.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        self.select(it.id);
        self._openContextMenu(e.clientX, e.clientY, it.id);
      });

      wrap.addEventListener('dragover', function (e) {
        e.preventDefault();
        e.stopPropagation();
        wrap.classList.add('mr-dragover-target');
      });
      wrap.addEventListener('dragleave', function () {
        wrap.classList.remove('mr-dragover-target');
      });
      wrap.addEventListener('drop', function (e) {
        e.preventDefault();
        e.stopPropagation();
        wrap.classList.remove('mr-dragover-target');
        var f = e.dataTransfer.files[0];
        if (!f) return;
        if (f.type.indexOf('image/') === 0) {
          self.replaceImage(it.id, f);
        } else if (f.type.indexOf('audio/') === 0) {
          self.uploadSound(it.id, f);
        }
      });

      if (it.id === this.selectedId && !it.posLocked) {
        this._attachHandles(wrap, it);
      }
    }

    this.canvasEl.appendChild(wrap);
  };

  MyRoomEditor.prototype._attachHandles = function (wrap, it) {
    var self = this;

    var resize = document.createElement('div');
    resize.className = 'mr-handle mr-resize';
    resize.addEventListener('mousedown', function (e) {
      e.stopPropagation();
      self._startDrag(e, it.id, 'resize');
    });
    resize.addEventListener('touchstart', function (e) {
      e.stopPropagation();
      self._startDrag(e.touches[0], it.id, 'resize', e);
    }, { passive: false });
    wrap.appendChild(resize);

    var rotate = document.createElement('div');
    rotate.className = 'mr-handle mr-rotate';
    rotate.addEventListener('mousedown', function (e) {
      e.stopPropagation();
      self._startDrag(e, it.id, 'rotate');
    });
    rotate.addEventListener('touchstart', function (e) {
      e.stopPropagation();
      self._startDrag(e.touches[0], it.id, 'rotate', e);
    }, { passive: false });
    wrap.appendChild(rotate);
  };

  // ---------- 선택 ----------
  MyRoomEditor.prototype.select = function (id) {
    this.selectedId = id;
    this.render();
    if (this.onSelect) this.onSelect(this.getItem(id));
  };

  MyRoomEditor.prototype.deselect = function () {
    this.selectedId = null;
    this.render();
    if (this.onSelect) this.onSelect(null);
  };

  MyRoomEditor.prototype.getItem = function (id) {
    return this.items.find(function (it) { return it.id === id; }) || null;
  };

  // ---------- 다중 선택(선택 삭제/복사/이동) ----------
  MyRoomEditor.prototype.enterMultiSelect = function () {
    this.deselect();
    this.multiSelectMode = 'picking';
    this.multiSelectIds = [];
    this.render();
  };

  MyRoomEditor.prototype.exitMultiSelect = function () {
    this.multiSelectMode = false;
    this.multiSelectIds = [];
    this.render();
  };

  MyRoomEditor.prototype.toggleMultiSelect = function (id) {
    var idx = this.multiSelectIds.indexOf(id);
    if (idx >= 0) this.multiSelectIds.splice(idx, 1);
    else this.multiSelectIds.push(id);
    this.render();
  };

  MyRoomEditor.prototype.deleteMultiSelected = function () {
    if (!this.multiSelectIds.length) return;
    this._pushHistory();
    var ids = this.multiSelectIds;
    this.items = this.items.filter(function (it) { return ids.indexOf(it.id) === -1; });
    this.exitMultiSelect();
  };

  MyRoomEditor.prototype.copyMultiSelected = function () {
    if (!this.multiSelectIds.length) return;
    this._pushHistory();
    var self = this;
    var newIds = [];
    this.multiSelectIds.slice().forEach(function (id) {
      var it = self.getItem(id);
      if (!it) return;
      var copy = Object.assign({}, it);
      copy.id = self._uid();
      copy.x = it.x + 20;
      copy.y = it.y + 20;
      self.nextZ = Math.min(self.nextZ + 1, MYROOM_Z_MAX);
      copy.z = myroomClampZ(self.nextZ);
      self.items.push(copy);
      newIds.push(copy.id);
    });
    // 복사된 새 아이템들을 그대로 선택 상태로 유지해서 바로 이동시킬 수 있게 함
    this.multiSelectIds = newIds;
    this.render();
  };

  // ---------- 드래그(이동/리사이즈/회전) ----------
  MyRoomEditor.prototype._startDrag = function (e, itemId, type, touchEvent) {
    if (touchEvent) touchEvent.preventDefault();
    this._pushHistory();
    // 이미 선택되어 있는 아이템이면 select()(=전체 재렌더링)를 다시 호출하지 않는다.
    // select()는 항상 render()를 실행해 캔버스를 통째로 다시 그리는데, 이걸 터치가 시작된
    // 바로 그 엘리먼트 위에서 매번 실행하면 방금 누른 DOM 노드가 즉시 삭제/재생성되어
    // 이후 touchmove/touchend가 브라우저에서 아예 전달되지 않는다(=크기조절/이동이 먹통이 되는 원인).
    if (this.selectedId !== itemId) {
      this.select(itemId);
    } else if (this.onSelect) {
      this.onSelect(this.getItem(itemId));
    }
    var it = this.getItem(itemId);
    var rect = this.canvasEl.getBoundingClientRect();

    this._dragState = {
      type: type,
      itemId: itemId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      canvasRect: rect,
      orig: Object.assign({}, it),
      centerX: rect.left + (it.x + it.w / 2) * this.viewScale,
      centerY: rect.top + (it.y + it.h / 2) * this.viewScale
    };
  };

  // 다중 선택(picking) 상태에서도 아이템을 드래그로 옮길 수 있게 함.
  // 실제로 움직이지 않고 그냥 클릭(마우스업)만 하면 기존처럼 선택/해제 토글만 수행한다.
  MyRoomEditor.prototype._startPickModeDrag = function (e, itemId, touchEvent) {
    if (touchEvent) touchEvent.preventDefault();
    var it = this.getItem(itemId);
    if (!it) return;
    var rect = this.canvasEl.getBoundingClientRect();
    this._dragState = {
      type: 'move',
      itemId: itemId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      canvasRect: rect,
      orig: Object.assign({}, it),
      pickToggle: true,
      historyPushed: false
    };
  };

  MyRoomEditor.prototype._startGroupDrag = function (e, touchEvent) {
    if (touchEvent) touchEvent.preventDefault();
    this._pushHistory();
    var self = this;
    this._groupDragState = {
      startClientX: e.clientX,
      startClientY: e.clientY,
      origPositions: this.multiSelectIds.map(function (id) {
        var it = self.getItem(id);
        return { id: id, x: it ? it.x : 0, y: it ? it.y : 0 };
      })
    };
  };

  // 드래그(이동/리사이즈/회전) 도중에는 캔버스를 통째로 다시 그리지 않고,
  // 해당 아이템의 기존 DOM 엘리먼트 스타일만 직접 갱신한다.
  // (풀 렌더를 매 move마다 하면 터치 중인 엘리먼트가 사라졌다 새로 생기면서
  //  이후 touchmove/touchend 이벤트가 더 이상 전달되지 않아 "터치로 이동이 안 되는" 문제가 생긴다.)
  MyRoomEditor.prototype._syncItemPosition = function (it) {
    if (!it) return;
    var wrap = this._itemEls[it.id];
    if (!wrap) { this.render(); return; }
    wrap.style.left = it.x + 'px';
    wrap.style.top = it.y + 'px';
    wrap.style.width = it.w + 'px';
    wrap.style.height = it.h + 'px';
    wrap.style.transform = 'rotate(' + (it.rot || 0) + 'deg)' + (it.flip ? ' scaleX(-1)' : '');
  };

  MyRoomEditor.prototype._bindGlobalEvents = function () {
    var self = this;

    function move(clientX, clientY) {
      if (self._panState) {
        var ps = self._panState;
        self.panX = ps.origPanX + (clientX - ps.startClientX);
        self.panY = ps.origPanY + (clientY - ps.startClientY);
        self.canvasEl.style.transform = self._panScaleTransform();
        return;
      }
      if (self._boxSelectState) {
        var bs = self._boxSelectState;
        // 터치는 손가락을 떼지 않아도 좌표가 미세하게 흔들리는 경우가 많아서,
        // 마우스와 같은 3px 기준을 쓰면 '그냥 탭'했을 뿐인데도 moved=true가 되어
        // 선택 해제(deselect)가 되지 않는 문제가 있었다. 터치는 여유값을 더 준다.
        var boxMoveThreshold = bs.touch ? 10 : 3;
        if (Math.abs(clientX - bs.startClientX) > boxMoveThreshold || Math.abs(clientY - bs.startClientY) > boxMoveThreshold) {
          bs.moved = true;
        }
        if (bs.moved) self._updateBoxSelectVisual(clientX, clientY);
        return;
      }
      if (self._groupDragState) {
        var gd = self._groupDragState;
        gd.moved = true;
        var gdx = (clientX - gd.startClientX) / self.viewScale;
        var gdy = (clientY - gd.startClientY) / self.viewScale;
        gd.origPositions.forEach(function (p) {
          var git = self.getItem(p.id);
          if (!git) return;
          git.x = self._snap(Math.round(p.x + gdx));
          git.y = self._snap(Math.round(p.y + gdy));
          self._clampPosition(git);
          self._syncItemPosition(git);
        });
        return;
      }
      var ds = self._dragState;
      if (!ds) return;
      var it = self.getItem(ds.itemId);
      if (!it) return;

      if (Math.abs(clientX - ds.startClientX) > 3 || Math.abs(clientY - ds.startClientY) > 3) {
        if (!ds.moved && ds.pickToggle && !ds.historyPushed) {
          self._pushHistory();
          ds.historyPushed = true;
        }
        ds.moved = true;
      }

      if (ds.type === 'move') {
        var dx = (clientX - ds.startClientX) / self.viewScale;
        var dy = (clientY - ds.startClientY) / self.viewScale;
        it.x = self._snap(Math.round(ds.orig.x + dx));
        it.y = self._snap(Math.round(ds.orig.y + dy));
        self._clampPosition(it);
      } else if (ds.type === 'resize') {
        var dxr = (clientX - ds.startClientX) / self.viewScale;
        var dyr = (clientY - ds.startClientY) / self.viewScale;
        // 비율 유지 없이, 가로/세로를 각각 독립적으로 자유롭게 조절
        it.w = Math.max(self.gridSize, self._snap(Math.round(ds.orig.w + dxr)));
        it.h = Math.max(self.gridSize, self._snap(Math.round(ds.orig.h + dyr)));
        self._clampSize(it);
      } else if (ds.type === 'rotate') {
        var angle = Math.atan2(clientY - ds.centerY, clientX - ds.centerX) * 180 / Math.PI;
        it.rot = Math.round(angle + 90);
      }
      self._syncItemPosition(it);
    }

    self._docOn('mousemove', function (e) { move(e.clientX, e.clientY); });
    self._docOn('touchmove', function (e) {
      if ((self._dragState || self._groupDragState || self._boxSelectState || self._panState) && e.touches[0]) {
        e.preventDefault();
        move(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: false });

    function end() {
      if (self._panState) { self._panState = null; return; }
      var ds = self._dragState;
      var wasDragging = !!(ds || self._groupDragState);
      // 다중 선택 상태에서 드래그 없이 그냥 클릭만 한 경우 → 기존처럼 선택/해제 토글
      if (ds && ds.pickToggle && !ds.moved) {
        self.toggleMultiSelect(ds.itemId);
      }
      if (self._boxSelectState) self._finishBoxSelect();
      self._lastDragMoved = !!((ds && ds.moved) || (self._groupDragState && self._groupDragState.moved));
      // 드래그 중에는 가벼운 DOM 갱신만 했으므로, 끝난 시점에 한 번 제대로 다시 그려서 상태를 완전히 맞춘다.
      if (wasDragging) self.render();
      self._dragState = null;
      self._groupDragState = null;
      // click 이벤트가 mouseup 직후에 발생하므로, 다음 루프에서 플래그 해제
      setTimeout(function () { self._lastDragMoved = false; }, 0);
    }
    self._docOn('mouseup', end);
    self._docOn('touchend', end);

    // 캔버스 빈 곳: 편집 중이면 드래그로 다중 선택(사각형 드래그), 아니면 클릭 시 선택 해제
    this.canvasEl.addEventListener('mousedown', function (e) {
      if (e.target !== self.canvasEl) return;
      if (self.spaceDown) { e.preventDefault(); self._startPan(e.clientX, e.clientY); return; }
      if (self.editable) { self._startBoxSelect(e.clientX, e.clientY); return; }
      self.deselect();
    });
    this.canvasEl.addEventListener('touchstart', function (e) {
      if (e.target !== self.canvasEl) return;
      if (!e.touches[0]) return;
      if (self.spaceDown) { e.preventDefault(); self._startPan(e.touches[0].clientX, e.touches[0].clientY); return; }
      if (self.editable) {
        e.preventDefault();
        self._startBoxSelect(e.touches[0].clientX, e.touches[0].clientY, true);
        return;
      }
      self.deselect();
    }, { passive: false });

    // 파일 드래그 앤 드롭으로 새 아이템 추가 (캔버스 빈 영역)
    if (this.editable) {
      this.canvasEl.addEventListener('dragover', function (e) {
        e.preventDefault();
        self.canvasEl.classList.add('mr-dragover');
      });
      this.canvasEl.addEventListener('dragleave', function (e) {
        if (e.target === self.canvasEl) self.canvasEl.classList.remove('mr-dragover');
      });
      this.canvasEl.addEventListener('drop', function (e) {
        e.preventDefault();
        self.canvasEl.classList.remove('mr-dragover');
        var rect = self.canvasEl.getBoundingClientRect();
        var x = (e.clientX - rect.left) / self.viewScale;
        var y = (e.clientY - rect.top) / self.viewScale;
        var files = e.dataTransfer.files;
        for (var i = 0; i < files.length; i++) {
          var f = files[i];
          if (f.type.indexOf('image/') === 0) {
            self.uploadFile(f, null, x, y);
          }
          // 오디오 파일을 빈 캔버스에 놓는 경우는 대상 아이템이 없어 무시
        }
      });
    }
  };

  // ---------- 캔버스 빈 곳 드래그로 다중 선택(사각형 선택) ----------
  // 스페이스바+드래그로 화면(캔버스) 자체를 이동시키는 핸드 툴
  MyRoomEditor.prototype._startPan = function (clientX, clientY) {
    this._panState = { startClientX: clientX, startClientY: clientY, origPanX: this.panX, origPanY: this.panY };
  };

  MyRoomEditor.prototype._startBoxSelect = function (clientX, clientY, isTouch) {
    this._boxSelectState = {
      startClientX: clientX,
      startClientY: clientY,
      canvasRect: this.canvasEl.getBoundingClientRect(),
      moved: false,
      touch: !!isTouch
    };
  };

  MyRoomEditor.prototype._updateBoxSelectVisual = function (clientX, clientY) {
    var bs = this._boxSelectState;
    if (!bs) return;
    var x1 = (bs.startClientX - bs.canvasRect.left) / this.viewScale;
    var y1 = (bs.startClientY - bs.canvasRect.top) / this.viewScale;
    var x2 = (clientX - bs.canvasRect.left) / this.viewScale;
    var y2 = (clientY - bs.canvasRect.top) / this.viewScale;
    bs.rectX = Math.min(x1, x2);
    bs.rectY = Math.min(y1, y2);
    bs.rectW = Math.abs(x2 - x1);
    bs.rectH = Math.abs(y2 - y1);

    if (!bs.el) {
      bs.el = document.createElement('div');
      bs.el.className = 'mr-select-box';
      this.canvasEl.appendChild(bs.el);
    }
    bs.el.style.left = bs.rectX + 'px';
    bs.el.style.top = bs.rectY + 'px';
    bs.el.style.width = bs.rectW + 'px';
    bs.el.style.height = bs.rectH + 'px';
  };

  MyRoomEditor.prototype._finishBoxSelect = function () {
    var bs = this._boxSelectState;
    this._boxSelectState = null;
    if (!bs) return;
    if (bs.el && bs.el.parentNode) bs.el.parentNode.removeChild(bs.el);

    if (!bs.moved) {
      // 실제로 드래그하지 않고 그냥 클릭만 한 경우 → 단일 선택은 물론, 다중 선택 상태였다면 그것도 함께 해제
      this.deselect();
      if (this.multiSelectMode) {
        this.exitMultiSelect();
        if (this.onBoxSelect) this.onBoxSelect([]);
      }
      return;
    }

    var x1 = bs.rectX, y1 = bs.rectY, x2 = bs.rectX + bs.rectW, y2 = bs.rectY + bs.rectH;
    var ids = this.items.filter(function (it) {
      var ix1 = it.x, iy1 = it.y, ix2 = it.x + it.w, iy2 = it.y + it.h;
      // 선택 사각형과 조금이라도 겹치면 선택
      return ix1 < x2 && ix2 > x1 && iy1 < y2 && iy2 > y1;
    }).map(function (it) { return it.id; });

    if (!ids.length) return; // 드래그했지만 아무 아이템도 걸리지 않았으면 기존 선택 상태 유지

    // 드래그로 여러 개를 고르면, 별도 버튼 없이 바로 함께 옮길 수 있도록 '이동' 상태를 기본값으로 한다.
    // (삭제/복사는 여전히 리모콘의 ⋮ 메뉴 버튼을 눌러야 실행된다.)
    this.multiSelectMode = 'moving';
    this.multiSelectIds = ids;
    this.render();
    if (this.onBoxSelect) this.onBoxSelect(ids);
  };

  // ---------- 아이템 조작(툴바에서 호출) ----------
  MyRoomEditor.prototype.resetTransform = function (id) {
    var it = this.getItem(id);
    if (!it) return;
    this._pushHistory();
    it.rot = 0;
    if (it._origW) { it.w = it._origW; it.h = it._origH; }
    this.render();
  };

  MyRoomEditor.prototype.toggleFlip = function (id) {
    var it = this.getItem(id);
    if (!it) return;
    this._pushHistory();
    it.flip = !it.flip;
    this.render();
  };

  MyRoomEditor.prototype.updateItem = function (id, patch) {
    var it = this.getItem(id);
    if (!it) return;
    this._pushHistory();
    Object.assign(it, patch);
    if ('w' in patch || 'h' in patch) this._clampSize(it);
    if ('x' in patch || 'y' in patch || 'w' in patch || 'h' in patch) this._clampPosition(it);
    this.render();
    if (this.onSelect && id === this.selectedId) this.onSelect(it);
  };

  MyRoomEditor.prototype.toggleLock = function (id) {
    var it = this.getItem(id);
    if (!it) return;
    this._pushHistory();
    it.posLocked = !it.posLocked;
    this.render();
  };

  MyRoomEditor.prototype.bringToFront = function (id) {
    var it = this.getItem(id);
    if (!it) return;
    this._pushHistory();
    this.nextZ = Math.min(this.nextZ + 1, MYROOM_Z_MAX);
    it.z = myroomClampZ(this.nextZ);
    this.render();
  };

  MyRoomEditor.prototype.sendToBack = function (id) {
    var self = this;
    var it = this.getItem(id);
    if (!it) return;
    this._pushHistory();
    var minZ = this.items.reduce(function (m, x) { return Math.min(m, x.z || 0); }, 0);
    it.z = myroomClampZ(minZ - 1);
    this.render();
  };

  // 현재 z순서 기준 바로 위/아래 아이템과 z값을 맞바꿔 '한 칸' 이동
  MyRoomEditor.prototype.moveForward = function (id) {
    this._pushHistory();
    var sorted = this.items.slice().sort(function (a, b) { return (a.z || 0) - (b.z || 0); });
    var idx = sorted.findIndex(function (it) { return it.id === id; });
    if (idx > -1 && idx < sorted.length - 1) {
      var cur = sorted[idx], next = sorted[idx + 1];
      var tmp = cur.z; cur.z = next.z; next.z = tmp;
    }
    this.render();
  };

  MyRoomEditor.prototype.moveBackward = function (id) {
    this._pushHistory();
    var sorted = this.items.slice().sort(function (a, b) { return (a.z || 0) - (b.z || 0); });
    var idx = sorted.findIndex(function (it) { return it.id === id; });
    if (idx > 0) {
      var cur = sorted[idx], prev = sorted[idx - 1];
      var tmp = cur.z; cur.z = prev.z; prev.z = tmp;
    }
    this.render();
  };

  // 겹침 우선도(Z순서)를 사용자가 직접 지정할 때: 해당 순번 이상인 아이템들을 모두 +1 시켜
  // 지정한 순번에 끼워넣는다 (요구사항 8).
  MyRoomEditor.prototype.setZOrder = function (id, newZ) {
    var it = this.getItem(id);
    if (!it) return;
    this._pushHistory();
    newZ = myroomClampZ(parseInt(newZ, 10) || 0);
    this.items.forEach(function (x) {
      if (x.id !== id && (x.z || 0) >= newZ) {
        x.z = myroomClampZ((x.z || 0) + 1);
      }
    });
    it.z = newZ;
    if (newZ >= this.nextZ) this.nextZ = newZ;
    this.render();
    if (this.onSelect && id === this.selectedId) this.onSelect(it);
  };

  // ---------- 우클릭 레이어 메뉴 ----------
  MyRoomEditor.prototype._closeContextMenu = function () {
    if (this._ctxMenuEl) {
      this._ctxMenuEl.remove();
      this._ctxMenuEl = null;
    }
    document.removeEventListener('mousedown', this._ctxOutsideHandler, true);
    document.removeEventListener('touchstart', this._ctxOutsideHandler, true);
  };

  MyRoomEditor.prototype._openContextMenu = function (clientX, clientY, itemId) {
    var self = this;
    this._closeContextMenu();

    var it = this.getItem(itemId);
    if (!it) return;

    var menu = document.createElement('div');
    menu.className = 'mr-ctxmenu';
    menu.style.left = clientX + 'px';
    menu.style.top = clientY + 'px';

    var options = [
      { label: '편집', action: function () { if (self.onEdit) self.onEdit(it); } },
      { label: '맨 앞으로', action: function () { self.bringToFront(itemId); } },
      { label: '한 칸 앞으로', action: function () { self.moveForward(itemId); } },
      { label: '한 칸 뒤로', action: function () { self.moveBackward(itemId); } },
      { label: '맨 뒤로', action: function () { self.sendToBack(itemId); } },
      { label: it.posLocked ? '위치 잠금 해제' : '위치 잠그기', action: function () { self.toggleLock(itemId); } },
      { label: '좌우반전', action: function () { self.toggleFlip(itemId); } },
      { label: '삭제', action: function () { self.removeItem(itemId); }, danger: true }
    ];

    options.forEach(function (opt) {
      var btn = document.createElement('button');
      btn.textContent = opt.label;
      if (opt.danger) btn.className = 'mr-ctx-danger';
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        opt.action();
        self._closeContextMenu();
      });
      menu.appendChild(btn);
    });

    document.body.appendChild(menu);
    this._ctxMenuEl = menu;

    // 메뉴가 화면 밖으로 나가면 위치 보정
    var rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) menu.style.left = (window.innerWidth - rect.width - 8) + 'px';
    if (rect.bottom > window.innerHeight) menu.style.top = (window.innerHeight - rect.height - 8) + 'px';

    this._ctxOutsideHandler = function (e) {
      var target = (e.touches && e.touches[0]) ? document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY) : e.target;
      if (!menu.contains(target)) self._closeContextMenu();
    };
    // 다음 이벤트 루프에서 등록해야 지금 클릭/터치가 바로 닫지 않음
    setTimeout(function () {
      document.addEventListener('mousedown', self._ctxOutsideHandler, true);
      document.addEventListener('touchstart', self._ctxOutsideHandler, true);
    }, 0);
  };

  MyRoomEditor.prototype.setOpacity = function (id, val) {
    var it = this.getItem(id);
    if (!it) return;
    it.opacity = val;
    this.render();
  };

  MyRoomEditor.prototype.removeItem = function (id) {
    this._pushHistory();
    this.items = this.items.filter(function (it) { return it.id !== id; });
    if (this.selectedId === id) this.selectedId = null;
    this.render();
  };

  MyRoomEditor.prototype.addImageItem = function (src, w, h, dropX, dropY, zOverride) {
    this._pushHistory();
    w = w || 120; h = h || 120;
    var x = (dropX != null) ? Math.round(dropX - w / 2) : Math.round(this.canvasW / 2 - w / 2);
    var y = (dropY != null) ? Math.round(dropY - h / 2) : Math.round(this.canvasH / 2 - h / 2);
    // 카테고리별 기본 우선순위(zOverride)가 주어지면 그 값을 그대로 쓰고(바닥=0, 벽=1, 가구=2 등),
    // 없으면 기존처럼 항상 맨 위로 올라가도록 순차 증가값을 쓴다.
    var z;
    if (zOverride !== undefined && zOverride !== null) {
      z = myroomClampZ(zOverride);
    } else {
      this.nextZ = Math.min(this.nextZ + 1, MYROOM_Z_MAX);
      z = myroomClampZ(this.nextZ);
    }
    var it = {
      id: this._uid(),
      type: 'image',
      src: src,
      x: this._snap(x),
      y: this._snap(y),
      w: w,
      h: h,
      _origW: w,
      _origH: h,
      rot: 0,
      flip: false,
      z: z,
      opacity: 1,
      posLocked: false,
      clickAction: 'none',
      soundUrl: ''
    };
    // 크기는 절대 건드리지 않고(원본 그대로), 위치만 캔버스 안으로 들어오도록 보정한다.
    this._clampPosition(it);
    if (z >= this.nextZ) this.nextZ = z;
    this.items.push(it);
    this.select(it.id);
    return it;
  };

  MyRoomEditor.prototype.addTextItem = function (text) {
    this._pushHistory();
    this.nextZ = Math.min(this.nextZ + 1, MYROOM_Z_MAX);
    var z = myroomClampZ(this.nextZ);
    var it = {
      id: this._uid(),
      type: 'text',
      text: text || '텍스트',
      x: Math.round(this.canvasW / 2 - 60),
      y: Math.round(this.canvasH / 2 - 20),
      w: 120,
      h: 40,
      rot: 0,
      flip: false,
      z: z,
      opacity: 1,
      posLocked: false,
      clickAction: 'none',
      soundUrl: ''
    };
    this._clampSize(it);
    this._clampPosition(it);
    if (z >= this.nextZ) this.nextZ = z;
    this.items.push(it);
    this.select(it.id);
    return it;
  };

  // ---------- 업로드 & 저장 ----------
  MyRoomEditor.prototype.replaceImage = function (id, file, cb) {
    var self = this;
    if (!this.hooks.uploadImage) { if (cb) cb('업로드를 쓸 수 없어요'); return; }
    this._pushHistory();
    this.hooks.uploadImage(file).then(function (res) {
      self.updateItem(id, { src: res.url });
      if (cb) cb(null, res);
    }).catch(function (err) { if (cb) cb((err && err.message) || String(err)); });
  };

  // 클릭 시 재생할 사운드 파일 업로드 (mp3 등)
  MyRoomEditor.prototype.uploadSound = function (id, file, cb) {
    var self = this;
    if (!this.hooks.uploadSound) { if (cb) cb('업로드를 쓸 수 없어요'); return; }
    this._pushHistory();
    this.hooks.uploadSound(file).then(function (res) {
      self.updateItem(id, { soundUrl: res.url, clickAction: 'sound' });
      if (cb) cb(null, res);
    }).catch(function (err) { if (cb) cb((err && err.message) || String(err)); });
  };

  MyRoomEditor.prototype.uploadFile = function (file, cb, dropX, dropY) {
    var self = this;
    if (!this.hooks.uploadImage) { if (cb) cb('업로드를 쓸 수 없어요'); return; }
    this.hooks.uploadImage(file).then(function (res) {
      var it = self.addImageItem(res.url, res.w, res.h, dropX, dropY);
      if (cb) cb(null, res, it);
    }).catch(function (err) { if (cb) cb((err && err.message) || String(err)); });
  };

  MyRoomEditor.prototype.serialize = function () {
    return {
      canvas_w: this.canvasW,
      canvas_h: this.canvasH,
      items: this.items.map(function (it) {
        var copy = Object.assign({}, it);
        delete copy._origW;
        delete copy._origH;
        return copy;
      })
    };
  };

  MyRoomEditor.prototype.setRoomTitle = function (title) {
    this.roomTitle = title || '';
  };

  MyRoomEditor.prototype.save = function (cb) {
    if (!this.hooks.save) { if (cb) cb('저장을 쓸 수 없어요'); return; }
    this.hooks.save(this.serialize(), this.roomTitle).then(function () {
      if (cb) cb(null);
    }).catch(function (err) { if (cb) cb((err && err.message) || String(err)); });
  };

  global.MyRoomEditor = MyRoomEditor;
})(window);
