const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'booking-service',
  brokers: [process.env.KAFKA_BROKER || 'kafka:9092'],
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
});

const producer = kafka.producer();

let isConnected = false;

const connectProducer = async () => {
  try {
    await producer.connect();
    isConnected = true;
    console.log('✅ Kafka producer connected (booking-service)');
  } catch (error) {
    console.error('❌ Kafka producer connection error:', error.message);
    isConnected = false;
  }
};

// Send booking event
const sendBookingEvent = async (eventType, data) => {
  if (!isConnected) {
    console.warn('⚠️ Kafka producer not connected, attempting to send anyway...');
  }

  try {
    const message = {
      topic: 'booking-events',
      messages: [
        {
          key: data.bookingId || data.booking_id,
          value: JSON.stringify({
            eventType,
            timestamp: new Date().toISOString(),
            data
          }),
          headers: {
            'event-type': eventType,
            'service': 'booking-service'
          }
        }
      ]
    };

    await producer.send(message);
    console.log(`📤 Kafka: Sent ${eventType} event for booking ${data.bookingId || data.booking_id}`);
    
    return { success: true };
  } catch (error) {
    console.error('❌ Kafka send error:', error.message);
    return { success: false, error: error.message };
  }
};

// Graceful shutdown
const disconnectProducer = async () => {
  if (isConnected) {
    await producer.disconnect();
    console.log('👋 Kafka producer disconnected');
  }
};

module.exports = {
  connectProducer,
  sendBookingEvent,
  disconnectProducer
};