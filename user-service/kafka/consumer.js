const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'user-service',
  brokers: [process.env.KAFKA_BROKER || 'kafka:9092'],
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
});

const consumer = kafka.consumer({ 
  groupId: 'user-service-group',
  sessionTimeout: 30000,
  heartbeatInterval: 3000
});

const connectConsumer = async () => {
  try {
    await consumer.connect();
    console.log('✅ Kafka consumer connected (user-service)');
    
    await consumer.subscribe({ 
      topic: 'booking-events', 
      fromBeginning: true 
    });
    
    console.log('📥 Subscribed to booking-events topic');
  } catch (error) {
    console.error('❌ Kafka consumer connection error:', error.message);
  }
};

const startConsumer = async () => {
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const event = JSON.parse(message.value.toString());
        const eventType = event.eventType;
        
        console.log('📬 Received booking event:', {
          eventType,
          bookingId: event.data.bookingId,
          timestamp: event.timestamp
        });

        switch (eventType) {
          case 'BOOKING_CREATED':
            await handleBookingCreated(event.data);
            break;
          case 'BOOKING_ACCEPTED':
            await handleBookingAccepted(event.data);
            break;
          case 'BOOKING_CANCELLED':
            await handleBookingCancelled(event.data);
            break;
          default:
            console.log('❓ Unknown event type:', eventType);
        }
      } catch (error) {
        console.error('❌ Error processing message:', error);
      }
    },
  });
};

// Event Handlers
const handleBookingCreated = async (data) => {
  console.log('🏠 BOOKING_CREATED → Notifying owner:', data.ownerId);
  console.log('   Traveler:', data.travelerId, 'booked property:', data.propertyId);
  console.log('   Check-in:', data.checkIn, '| Check-out:', data.checkOut);
  // TODO: Send email/notification to owner
};

const handleBookingAccepted = async (data) => {
  console.log('✅ BOOKING_ACCEPTED → Notifying traveler:', data.travelerId);
  console.log('   Booking', data.bookingId, 'has been accepted by owner');
  // TODO: Send email/notification to traveler
};

const handleBookingCancelled = async (data) => {
  console.log('❌ BOOKING_CANCELLED → Notifying all parties');
  console.log('   Booking', data.bookingId, 'has been cancelled');
  // TODO: Send notifications to traveler and owner
};

const disconnectConsumer = async () => {
  await consumer.disconnect();
  console.log('👋 Kafka consumer disconnected');
};

module.exports = {
  connectConsumer,
  startConsumer,
  disconnectConsumer
};