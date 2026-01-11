"use client";

import { useState, useEffect } from 'react';
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
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

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

  // Always render button to avoid hydration mismatch, but disable when no user
  const canInteract = !!userId && isHydrated;

  return (
    <button
      type="button"
      onClick={canInteract ? handleLike : undefined}
      disabled={!canInteract || isLiking}
      className={`
        flex items-center gap-1.5
        text-sm rounded-lg px-3 py-1.5
        transition-all duration-200
        ${
          canInteract
            ? isLiked
              ? 'text-red-500 bg-red-50 hover:bg-red-100 font-medium cursor-pointer'
              : 'text-gray-400 hover:text-red-400 hover:bg-red-50 font-medium cursor-pointer'
            : 'text-gray-300 cursor-default'
        }
        ${isLiking ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <svg
        className={`w-4 h-4 transition-transform ${isLiked && canInteract ? 'scale-110' : ''}`}
        fill={isLiked && canInteract ? 'currentColor' : 'none'}
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
