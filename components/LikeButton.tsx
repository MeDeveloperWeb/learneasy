"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface LikeButtonProps {
  resourceId: string;
  initialLikesCount: number;
  initialIsLiked: boolean;
  userId: string | null;
}

export function LikeButton({
  resourceId,
  initialLikesCount,
  initialIsLiked,
  userId,
}: LikeButtonProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId || isLiking) return;

    // Optimistic update
    const newIsLiked = !isLiked;
    const newLikesCount = newIsLiked ? likesCount + 1 : likesCount - 1;

    setIsLiked(newIsLiked);
    setLikesCount(newLikesCount);
    setIsLiking(true);

    try {
      const res = await fetch(`/api/resources/${resourceId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        throw new Error('Failed to toggle like');
      }

      const data = await res.json();

      // Update with server response
      setIsLiked(data.liked);
      setLikesCount(data.likesCount);

      // Refresh to update sort order
      router.refresh();
    } catch (error) {
      // Revert optimistic update on error
      setIsLiked(isLiked);
      setLikesCount(likesCount);
      console.error('Error toggling like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  if (!userId) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-gray-300">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        <span>{likesCount}</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleLike}
      disabled={isLiking}
      className={`
        flex items-center gap-1.5
        text-sm font-medium rounded-lg px-3 py-1.5
        transition-all duration-200
        ${
          isLiked
            ? 'text-red-500 bg-red-50 hover:bg-red-100'
            : 'text-gray-400 hover:text-red-400 hover:bg-red-50'
        }
        ${isLiking ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <svg
        className={`w-4 h-4 transition-transform ${isLiked ? 'scale-110' : ''}`}
        fill={isLiked ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      <span>{likesCount}</span>
    </button>
  );
}
