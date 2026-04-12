import { useEffect, useRef } from 'react';
import type { Message } from '../types/flow';

export function useAutoScroll(messages: Message[], isTyping: boolean) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' });
    });
  }, [messages.length, isTyping]);

  return ref;
}
