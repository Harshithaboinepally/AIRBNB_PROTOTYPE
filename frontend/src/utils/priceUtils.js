// Format price
export const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(price);
};

// Calculate total price
export const calculateTotalPrice = (pricePerNight, nights) => {
    return pricePerNight * nights;
};