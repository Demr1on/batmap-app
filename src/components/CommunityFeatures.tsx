"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Rating {
  id: number;
  user_email: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface Discussion {
  id: number;
  user_email: string;
  content: string;
  created_at: string;
  replies?: Discussion[];
}

interface CommunityFeaturesProps {
  recordingId: number;
  recordingTitle: string;
}

export default function CommunityFeatures({ recordingId, recordingTitle }: CommunityFeaturesProps) {
  const { data: session } = useSession();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [userRating, setUserRating] = useState<number>(0);
  const [userComment, setUserComment] = useState('');
  const [newDiscussion, setNewDiscussion] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadRatings();
    loadDiscussions();
  }, [recordingId]);

  const loadRatings = async () => {
    try {
      const response = await fetch(`/api/ratings/${recordingId}`);
      const data = await response.json();
      if (data.ratings) {
        setRatings(data.ratings);
        
        // Finde Benutzer-Bewertung
        const userRatingData = data.ratings.find(
          (r: Rating) => r.user_email === session?.user?.email
        );
        if (userRatingData) {
          setUserRating(userRatingData.rating);
          setUserComment(userRatingData.comment);
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden der Bewertungen:', error);
    }
  };

  const loadDiscussions = async () => {
    try {
      const response = await fetch(`/api/discussions/${recordingId}`);
      const data = await response.json();
      if (data.discussions) {
        setDiscussions(data.discussions);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Diskussionen:', error);
    }
  };

  const submitRating = async () => {
    if (!session?.user?.email || userRating === 0) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recording_id: recordingId,
          rating: userRating,
          comment: userComment
        })
      });

      if (response.ok) {
        loadRatings();
      }
    } catch (error) {
      console.error('Fehler beim Senden der Bewertung:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitDiscussion = async () => {
    if (!session?.user?.email || !newDiscussion.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/discussions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recording_id: recordingId,
          content: newDiscussion
        })
      });

      if (response.ok) {
        setNewDiscussion('');
        loadDiscussions();
      }
    } catch (error) {
      console.error('Fehler beim Senden der Diskussion:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitReply = async (parentId: number) => {
    if (!session?.user?.email || !replyContent.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/discussions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recording_id: recordingId,
          content: replyContent,
          parent_id: parentId
        })
      });

      if (response.ok) {
        setReplyContent('');
        setReplyTo(null);
        loadDiscussions();
      }
    } catch (error) {
      console.error('Fehler beim Senden der Antwort:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAverageRating = () => {
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
    return sum / ratings.length;
  };

  const StarRating = ({ rating, onRatingChange, readonly = false }: any) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => !readonly && onRatingChange(star)}
            className={`text-2xl ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            } ${readonly ? 'cursor-default' : 'cursor-pointer hover:text-yellow-300'}`}
            disabled={readonly}
          >
            ⭐
          </button>
        ))}
      </div>
    );
  };

  if (!session) {
    return (
      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <p className="text-gray-600">Melden Sie sich an, um Bewertungen und Diskussionen zu sehen.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Bewertungen */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Community-Bewertungen</h3>
        
        {ratings.length > 0 && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <StarRating rating={Math.round(getAverageRating())} readonly />
              <span className="text-sm text-gray-600">
                {getAverageRating().toFixed(1)} von 5 ({ratings.length} Bewertungen)
              </span>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Ihre Bewertung</h4>
            <StarRating rating={userRating} onRatingChange={setUserRating} />
            <textarea
              value={userComment}
              onChange={(e) => setUserComment(e.target.value)}
              placeholder="Optionaler Kommentar..."
              className="w-full mt-2 p-2 border rounded-md"
              rows={3}
            />
            <button
              onClick={submitRating}
              disabled={isLoading || userRating === 0}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
            >
              {isLoading ? 'Speichere...' : 'Bewertung abgeben'}
            </button>
          </div>

          {ratings.filter(r => r.user_email !== session.user?.email).map((rating) => (
            <div key={rating.id} className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <StarRating rating={rating.rating} readonly />
                <span className="text-sm text-gray-500">
                  {rating.user_email.split('@')[0]} • {new Date(rating.created_at).toLocaleDateString('de-DE')}
                </span>
              </div>
              {rating.comment && (
                <p className="text-gray-700">{rating.comment}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Diskussionen */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Diskussion</h3>
        
        <div className="mb-4 p-4 border rounded-lg">
          <textarea
            value={newDiscussion}
            onChange={(e) => setNewDiscussion(e.target.value)}
            placeholder="Teilen Sie Ihre Gedanken zu dieser Aufnahme..."
            className="w-full p-2 border rounded-md"
            rows={3}
          />
          <button
            onClick={submitDiscussion}
            disabled={isLoading || !newDiscussion.trim()}
            className="mt-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400"
          >
            {isLoading ? 'Poste...' : 'Diskussion starten'}
          </button>
        </div>

        <div className="space-y-4">
          {discussions.map((discussion) => (
            <div key={discussion.id} className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <span className="font-medium">{discussion.user_email.split('@')[0]}</span>
                <span className="text-sm text-gray-500">
                  {new Date(discussion.created_at).toLocaleDateString('de-DE')}
                </span>
              </div>
              <p className="text-gray-700 mb-2">{discussion.content}</p>
              
              <button
                onClick={() => setReplyTo(discussion.id)}
                className="text-blue-500 hover:text-blue-700 text-sm"
              >
                Antworten
              </button>

              {replyTo === discussion.id && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Ihre Antwort..."
                    className="w-full p-2 border rounded-md"
                    rows={2}
                  />
                  <div className="mt-2 flex space-x-2">
                    <button
                      onClick={() => submitReply(discussion.id)}
                      disabled={isLoading || !replyContent.trim()}
                      className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
                    >
                      Antworten
                    </button>
                    <button
                      onClick={() => setReplyTo(null)}
                      className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              )}

              {discussion.replies?.map((reply) => (
                <div key={reply.id} className="ml-6 mt-2 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-sm">{reply.user_email.split('@')[0]}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(reply.created_at).toLocaleDateString('de-DE')}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm">{reply.content}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}