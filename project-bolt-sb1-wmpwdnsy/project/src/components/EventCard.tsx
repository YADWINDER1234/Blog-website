import { Calendar, MapPin, Users, DollarSign } from 'lucide-react';
import { Event } from '../lib/supabase';

type EventCardProps = {
  event: Event;
  onClick: () => void;
};

export default function EventCard({ event, onClick }: EventCardProps) {
  const eventDate = new Date(event.event_date);
  const isUpcoming = eventDate > new Date();
  const availabilityPercent = (event.available_seats / event.total_seats) * 100;

  let availabilityColor = 'text-green-600';
  if (availabilityPercent < 20) availabilityColor = 'text-red-600';
  else if (availabilityPercent < 50) availabilityColor = 'text-orange-600';

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={event.image_url || 'https://images.pexels.com/photos/2747449/pexels-photo-2747449.jpeg'}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        {!isUpcoming && (
          <div className="absolute top-0 left-0 right-0 bottom-0 bg-black bg-opacity-60 flex items-center justify-center">
            <span className="text-white text-xl font-bold">Event Passed</span>
          </div>
        )}
        {event.available_seats === 0 && isUpcoming && (
          <div className="absolute top-0 left-0 right-0 bottom-0 bg-red-600 bg-opacity-70 flex items-center justify-center">
            <span className="text-white text-xl font-bold">SOLD OUT</span>
          </div>
        )}
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2">{event.title}</h3>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-gray-600">
            <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="text-sm">
              {eventDate.toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>

          <div className="flex items-center text-gray-600">
            <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="text-sm line-clamp-1">{event.location}</span>
          </div>

          <div className="flex items-center">
            <Users className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className={`text-sm font-medium ${availabilityColor}`}>
              {event.available_seats} / {event.total_seats} seats available
            </span>
          </div>

          <div className="flex items-center text-gray-800">
            <DollarSign className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="text-sm font-bold">${event.price.toFixed(2)}</span>
          </div>
        </div>

        <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition font-medium">
          View Details
        </button>
      </div>
    </div>
  );
}
