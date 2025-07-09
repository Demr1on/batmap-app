import { useState, useEffect } from 'react';
import { UserProgress, Badge } from '@/types';
import { BadgeSystem } from '@/utils/badgeSystem';

export function useUserProgress(userEmail: string | null) {
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userEmail) {
      setUserProgress(null);
      setLoading(false);
      return;
    }

    loadUserProgress();
  }, [userEmail]);

  const loadUserProgress = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/progress/${encodeURIComponent(userEmail!)}`);
      
      if (response.ok) {
        const data = await response.json();
        setUserProgress(data.progress);
      } else {
        // Erstelle neuen User Progress wenn nicht vorhanden
        const newProgress: UserProgress = {
          species_discovered: [],
          total_recordings: 0,
          accuracy_score: 0,
          badges: [],
          contribution_rank: 0,
          monthly_streak: 0
        };
        setUserProgress(newProgress);
      }
    } catch (err) {
      setError('Fehler beim Laden des Fortschritts');
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (newRecording: any) => {
    if (!userProgress || !userEmail) return;

    try {
      const updatedProgress: UserProgress = {
        ...userProgress,
        total_recordings: userProgress.total_recordings + 1,
        species_discovered: userProgress.species_discovered.includes(newRecording.fledermaus_art_name) 
          ? userProgress.species_discovered 
          : [...userProgress.species_discovered, newRecording.fledermaus_art_name],
        accuracy_score: calculateNewAccuracy(userProgress, newRecording.wahrscheinlichkeit)
      };

      // Prüfe auf neue Badges
      const newBadges = BadgeSystem.checkForNewBadges(updatedProgress, newRecording);
      if (newBadges.length > 0) {
        updatedProgress.badges = [...updatedProgress.badges, ...newBadges];
      }

      // Speichere in Datenbank
      await fetch('/api/users/progress', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail,
          progress: updatedProgress
        })
      });

      setUserProgress(updatedProgress);
      
      // Zeige neue Badges
      if (newBadges.length > 0) {
        showBadgeNotification(newBadges);
      }
    } catch (err) {
      setError('Fehler beim Aktualisieren des Fortschritts');
    }
  };

  const calculateNewAccuracy = (currentProgress: UserProgress, newAccuracy: number): number => {
    const totalRecordings = currentProgress.total_recordings;
    const currentTotal = currentProgress.accuracy_score * totalRecordings;
    return (currentTotal + newAccuracy) / (totalRecordings + 1);
  };

  const showBadgeNotification = (badges: Badge[]) => {
    badges.forEach(badge => {
      // Einfache Notification - könnte erweitert werden
      if (typeof window !== 'undefined' && 'Notification' in window) {
        new Notification(`Neues Badge erhalten: ${badge.name}`, {
          body: badge.description,
          icon: `/badges/${badge.id}.png`
        });
      }
    });
  };

  const getNextBadgeProgress = () => {
    if (!userProgress) return null;
    return BadgeSystem.getProgressToNextBadge(userProgress);
  };

  return {
    userProgress,
    loading,
    error,
    updateProgress,
    getNextBadgeProgress,
    reload: loadUserProgress
  };
}