import { useEffect, useState } from 'react';
import { Calendar, MapPin, Users, DollarSign, ArrowLeft, Ticket } from 'lucide-react';
import { supabase, Event } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type EventDetailPageProps = {
  eventId: string;
  onBack: () => void;
  onNavigate: (page: string) => void;
};

export default function EventDetailPage({ eventId, onBack, onNavigate }: EventDetailPageProps) {
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [seatsToBook, setSeatsToBook] = useState(1);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .maybeSingle();

      if (error) throw error;
      setEvent(data);
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!user) {
      setMessage({ type: 'error', text: 'Please login to book tickets' });
      setTimeout(() => onNavigate('login'), 2000);
      return;
    }

    if (!event) return;

    if (seatsToBook > event.available_seats) {
      setMessage({ type: 'error', text: 'Not enough seats available' });
      return;
    }

    setBooking(true);
    setMessage(null);

    try {
      const { error } = await supabase.from('bookings').insert([
        {
          user_id: user.id,
          event_id: event.id,
          seats_booked: seatsToBook,
          booking_status: 'confirmed',
        },
      ]);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Booking confirmed! Check your dashboard.' });
      await fetchEvent();
      setSeatsToBook(1);
    } catch (error: unknown) {
      const err = error as { message?: string };
      setMessage({
        type: 'error',
        text: err.message || 'Failed to book tickets. Please try again.',
      });
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-xl mb-4">Event not found</p>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.event_date);
  const isUpcoming = eventDate > new Date();
  const isPastEvent = !isUpcoming;
  const isSoldOut = event.available_seats === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button
          onClick={onBack}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-8 transition"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="font-medium">Back to Events</span>
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="relative h-96">
            <img
              src={event.image_url || 'https://images.pexels.com/photos/2747449/pexels-photo-2747449.jpeg'}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            {isPastEvent && (
              <div className="absolute top-0 left-0 right-0 bottom-0 bg-black bg-opacity-60 flex items-center justify-center">
                <span className="text-white text-3xl font-bold">This Event Has Passed</span>
              </div>
            )}
            {isSoldOut && isUpcoming && (
              <div className="absolute top-0 left-0 right-0 bottom-0 bg-red-600 bg-opacity-70 flex items-center justify-center">
                <span className="text-white text-3xl font-bold">SOLD OUT</span>
              </div>
            )}
          </div>

          <div className="p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">{event.title}</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="flex items-center space-x-3 text-gray-700">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date & Time</p>
                  <p className="font-medium">
                    {eventDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-sm text-gray-600">
                    {eventDate.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-gray-700">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{event.location}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-gray-700">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Availability</p>
                  <p className="font-medium">
                    {event.available_seats} / {event.total_seats} seats
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-gray-700">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Price per ticket</p>
                  <p className="font-medium text-2xl">${event.price.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Event</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{event.description}</p>
            </div>

            {isUpcoming && !isSoldOut && (
              <div className="border-t pt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Book Your Tickets</h2>

                <div className="flex items-center gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Seats
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={event.available_seats}
                      value={seatsToBook}
                      onChange={(e) => setSeatsToBook(parseInt(e.target.value) || 1)}
                      className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Total Price</p>
                    <p className="text-3xl font-bold text-blue-600">
                      ${(event.price * seatsToBook).toFixed(2)}
                    </p>
                  </div>
                </div>

                {message && (
                  <div
                    className={`p-4 rounded-lg mb-6 ${
                      message.type === 'success'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {message.text}
                  </div>
                )}

                <button
                  onClick={handleBooking}
                  disabled={booking}
                  className="flex items-center justify-center space-x-2 w-full md:w-auto px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
                >
                  <Ticket className="w-6 h-6" />
                  <span>{booking ? 'Booking...' : 'Confirm Booking'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
