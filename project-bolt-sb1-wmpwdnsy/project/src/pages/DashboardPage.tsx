import { useEffect, useState } from 'react';
import { Calendar, MapPin, Users, Ticket, X } from 'lucide-react';
import { supabase, Booking } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type DashboardPageProps = {
  onEventClick: (eventId: string) => void;
};

export default function DashboardPage({ onEventClick }: DashboardPageProps) {
  const { user, profile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          events (*)
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    setCancellingId(bookingId);

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ booking_status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;

      await fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  const confirmedBookings = bookings.filter((b) => b.booking_status === 'confirmed');
  const cancelledBookings = bookings.filter((b) => b.booking_status === 'cancelled');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Dashboard</h1>
          <p className="text-xl text-gray-600">
            Welcome back, {profile?.full_name || 'User'}!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-900">{bookings.length}</p>
              </div>
              <div className="bg-blue-100 p-4 rounded-lg">
                <Ticket className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Active Bookings</p>
                <p className="text-3xl font-bold text-green-600">{confirmedBookings.length}</p>
              </div>
              <div className="bg-green-100 p-4 rounded-lg">
                <Calendar className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Cancelled</p>
                <p className="text-3xl font-bold text-red-600">{cancelledBookings.length}</p>
              </div>
              <div className="bg-red-100 p-4 rounded-lg">
                <X className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {confirmedBookings.length === 0 && cancelledBookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No bookings yet</h3>
            <p className="text-gray-600 mb-6">Start exploring events and book your first ticket!</p>
          </div>
        ) : (
          <>
            {confirmedBookings.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Active Bookings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {confirmedBookings.map((booking) => {
                    const event = booking.events;
                    if (!event) return null;

                    const eventDate = new Date(event.event_date);
                    const isPast = eventDate < new Date();

                    return (
                      <div
                        key={booking.id}
                        className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition"
                      >
                        <div className="relative h-48">
                          <img
                            src={event.image_url || 'https://images.pexels.com/photos/2747449/pexels-photo-2747449.jpeg'}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                          {isPast && (
                            <div className="absolute top-2 right-2 bg-gray-900 bg-opacity-80 text-white px-3 py-1 rounded-full text-sm font-medium">
                              Completed
                            </div>
                          )}
                        </div>

                        <div className="p-6">
                          <h3 className="text-xl font-bold text-gray-900 mb-4">{event.title}</h3>

                          <div className="space-y-2 mb-4">
                            <div className="flex items-center text-gray-600 text-sm">
                              <Calendar className="w-4 h-4 mr-2" />
                              <span>
                                {eventDate.toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>

                            <div className="flex items-center text-gray-600 text-sm">
                              <MapPin className="w-4 h-4 mr-2" />
                              <span>{event.location}</span>
                            </div>

                            <div className="flex items-center text-gray-600 text-sm">
                              <Users className="w-4 h-4 mr-2" />
                              <span>{booking.seats_booked} seat(s) booked</span>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <button
                              onClick={() => onEventClick(event.id)}
                              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                            >
                              View Event
                            </button>

                            {!isPast && (
                              <button
                                onClick={() => handleCancelBooking(booking.id)}
                                disabled={cancellingId === booking.id}
                                className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition disabled:opacity-50 text-sm font-medium"
                              >
                                {cancellingId === booking.id ? 'Cancelling...' : 'Cancel'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {cancelledBookings.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Cancelled Bookings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {cancelledBookings.map((booking) => {
                    const event = booking.events;
                    if (!event) return null;

                    const eventDate = new Date(event.event_date);

                    return (
                      <div
                        key={booking.id}
                        className="bg-white rounded-xl shadow-md overflow-hidden opacity-75"
                      >
                        <div className="relative h-48">
                          <img
                            src={event.image_url || 'https://images.pexels.com/photos/2747449/pexels-photo-2747449.jpeg'}
                            alt={event.title}
                            className="w-full h-full object-cover grayscale"
                          />
                          <div className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                            Cancelled
                          </div>
                        </div>

                        <div className="p-6">
                          <h3 className="text-xl font-bold text-gray-900 mb-4">{event.title}</h3>

                          <div className="space-y-2 mb-4">
                            <div className="flex items-center text-gray-600 text-sm">
                              <Calendar className="w-4 h-4 mr-2" />
                              <span>
                                {eventDate.toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>

                            <div className="flex items-center text-gray-600 text-sm">
                              <Users className="w-4 h-4 mr-2" />
                              <span>{booking.seats_booked} seat(s) were booked</span>
                            </div>
                          </div>

                          <button
                            onClick={() => onEventClick(event.id)}
                            className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition text-sm font-medium"
                          >
                            View Event
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
