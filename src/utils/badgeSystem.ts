import { Badge, UserProgress } from '@/types';

export class BadgeSystem {
  private static readonly BADGES: Omit<Badge, 'earned_at'>[] = [
    {
      id: 'first_recording',
      name: 'Erste Aufnahme',
      description: 'Herzlichen Glückwunsch zu Ihrer ersten Fledermaus-Aufnahme!',
      icon: '🦇',
      rarity: 'common'
    },
    {
      id: 'species_collector',
      name: 'Artensammler',
      description: '5 verschiedene Fledermausarten entdeckt',
      icon: '🔬',
      rarity: 'common'
    },
    {
      id: 'night_owl',
      name: 'Nachteule',
      description: '50 Aufnahmen zwischen 22:00 und 06:00 Uhr',
      icon: '🌙',
      rarity: 'rare'
    },
    {
      id: 'accuracy_expert',
      name: 'Genauigkeits-Experte',
      description: 'Durchschnittliche Erkennungsgenauigkeit über 85%',
      icon: '🎯',
      rarity: 'rare'
    },
    {
      id: 'monthly_streak',
      name: 'Monats-Streak',
      description: 'Jeden Tag im Monat mindestens eine Aufnahme',
      icon: '📅',
      rarity: 'rare'
    },
    {
      id: 'rare_species',
      name: 'Seltene Entdeckung',
      description: 'Eine seltene Fledermausart entdeckt',
      icon: '💎',
      rarity: 'legendary'
    },
    {
      id: 'community_contributor',
      name: 'Community-Beitrag',
      description: '100 Aufnahmen zur Wissenschaft beigetragen',
      icon: '🌟',
      rarity: 'legendary'
    },
    {
      id: 'habitat_explorer',
      name: 'Habitat-Erkunder',
      description: 'Aufnahmen in 10 verschiedenen Habitaten',
      icon: '🌲',
      rarity: 'rare'
    }
  ];

  static checkForNewBadges(userProgress: UserProgress, newRecording: any): Badge[] {
    const newBadges: Badge[] = [];
    const earnedBadgeIds = userProgress.badges.map(b => b.id);

    // Erste Aufnahme
    if (!earnedBadgeIds.includes('first_recording') && userProgress.total_recordings === 1) {
      newBadges.push(this.createBadge('first_recording'));
    }

    // Artensammler
    if (!earnedBadgeIds.includes('species_collector') && userProgress.species_discovered.length >= 5) {
      newBadges.push(this.createBadge('species_collector'));
    }

    // Genauigkeits-Experte
    if (!earnedBadgeIds.includes('accuracy_expert') && userProgress.accuracy_score >= 0.85) {
      newBadges.push(this.createBadge('accuracy_expert'));
    }

    // Monats-Streak
    if (!earnedBadgeIds.includes('monthly_streak') && userProgress.monthly_streak >= 30) {
      newBadges.push(this.createBadge('monthly_streak'));
    }

    // Community-Beitrag
    if (!earnedBadgeIds.includes('community_contributor') && userProgress.total_recordings >= 100) {
      newBadges.push(this.createBadge('community_contributor'));
    }

    return newBadges;
  }

  private static createBadge(badgeId: string): Badge {
    const badgeTemplate = this.BADGES.find(b => b.id === badgeId);
    if (!badgeTemplate) throw new Error(`Badge ${badgeId} not found`);

    return {
      ...badgeTemplate,
      earned_at: new Date()
    };
  }

  static calculateUserRank(userProgress: UserProgress, allUsers: UserProgress[]): number {
    const sortedUsers = allUsers.sort((a, b) => {
      const scoreA = this.calculateScore(a);
      const scoreB = this.calculateScore(b);
      return scoreB - scoreA;
    });

    const userScore = this.calculateScore(userProgress);
    const rank = sortedUsers.findIndex(user => this.calculateScore(user) <= userScore) + 1;
    
    return rank;
  }

  private static calculateScore(userProgress: UserProgress): number {
    let score = 0;
    
    // Basis-Score für Aufnahmen
    score += userProgress.total_recordings * 10;
    
    // Bonus für Artenvielfalt
    score += userProgress.species_discovered.length * 50;
    
    // Genauigkeits-Bonus
    score += userProgress.accuracy_score * 1000;
    
    // Badge-Bonus
    const rarityMultiplier = { common: 1, rare: 3, legendary: 10 };
    userProgress.badges.forEach(badge => {
      score += 100 * rarityMultiplier[badge.rarity];
    });
    
    // Streak-Bonus
    score += userProgress.monthly_streak * 5;
    
    return score;
  }

  static getProgressToNextBadge(userProgress: UserProgress): { badge: Omit<Badge, 'earned_at'>, progress: number, target: number } | null {
    const earnedBadgeIds = userProgress.badges.map(b => b.id);
    const unearned = this.BADGES.filter(b => !earnedBadgeIds.includes(b.id));
    
    if (unearned.length === 0) return null;

    // Finde nächstes erreichbares Badge
    for (const badge of unearned) {
      let progress = 0;
      let target = 0;
      
      switch (badge.id) {
        case 'species_collector':
          progress = userProgress.species_discovered.length;
          target = 5;
          break;
        case 'accuracy_expert':
          progress = userProgress.accuracy_score * 100;
          target = 85;
          break;
        case 'monthly_streak':
          progress = userProgress.monthly_streak;
          target = 30;
          break;
        case 'community_contributor':
          progress = userProgress.total_recordings;
          target = 100;
          break;
        default:
          continue;
      }
      
      if (progress < target) {
        return { badge, progress, target };
      }
    }
    
    return null;
  }
}