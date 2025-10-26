import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export const useKeepAlive = () => {
  const keepAliveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    // Track user activity
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    // Add event listeners for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    // Keep-alive mechanism - ping Supabase every 2 minutes if user is active
    const startKeepAlive = () => {
      keepAliveIntervalRef.current = setInterval(async () => {
        const timeSinceLastActivity = Date.now() - lastActivityRef.current;
        
        // Only keep alive if user has been active in the last 5 minutes
        if (timeSinceLastActivity < 5 * 60 * 1000) {
          try {
            // Simple ping to keep connection alive
            await supabase.from('users').select('count').limit(1);
            console.log('💓 Keep-alive ping successful');
          } catch (error) {
            console.warn('💓 Keep-alive ping failed:', error);
          }
        }
      }, 2 * 60 * 1000); // Every 2 minutes
    };

    startKeepAlive();

    return () => {
      // Cleanup
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
      
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
        keepAliveIntervalRef.current = null;
      }
    };
  }, []);

  return {
    // Expose method to manually trigger keep-alive
    ping: async () => {
      try {
        await supabase.from('users').select('count').limit(1);
        console.log('💓 Manual keep-alive ping successful');
        return true;
      } catch (error) {
        console.warn('💓 Manual keep-alive ping failed:', error);
        return false;
      }
    }
  };
};
