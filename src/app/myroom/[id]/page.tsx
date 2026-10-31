'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import MyRoomView from '@/components/myroom/MyRoomView';

export default function MyRoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <MyRoomView roomId={id} />;
}
