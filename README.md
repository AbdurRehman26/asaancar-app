# AsaanCar React Native App

A React Native mobile application for the AsaanCar car rental service, built with Expo and React Navigation.

## Features

- **Car Browsing**: Browse available cars with filters (brand, type, transmission, fuel type, seats, price) - **No login required**
- **Car Details**: View detailed information about each car - **No login required**
- **Booking System**: Create and manage car rental bookings - **Login required**
- **User Authentication**: Login and registration functionality
- **My Bookings**: View all your bookings in one place - **Login required**
- **User Profile**: Manage your profile and account settings - **Login required**

### Access Control

The app is designed to be accessible without login. Users can:
- Browse all available cars
- View car details and specifications
- Apply filters to search for cars

Login is only required for:
- Creating bookings
- Viewing personal bookings
- Accessing profile settings

## Tech Stack

- React Native (Expo)
- React Navigation
- Axios for API calls
- AsyncStorage for local storage
- React Context for state management

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on iOS:
```bash
npm run ios
```

4. Run on Android:
```bash
npm run android
```

## Project Structure

```
asaancar-app/
├── src/
│   ├── context/
│   │   └── AuthContext.js       # Authentication context
│   ├── navigation/
│   │   └── AppNavigator.js      # Navigation setup
│   ├── screens/
│   │   ├── HomeScreen.js        # Car listing with filters
│   │   ├── CarDetailScreen.js   # Car details view
│   │   ├── BookingScreen.js     # Create booking
│   │   ├── MyBookingsScreen.js  # View bookings
│   │   ├── LoginScreen.js       # Login
│   │   ├── RegisterScreen.js   # Registration
│   │   └── ProfileScreen.js     # User profile
│   └── services/
│       └── api.js              # API service layer
├── App.js                       # Main app component
└── package.json
```

## API Integration

The app integrates with the AsaanCar API at `https://asaancar.com/api`. The following endpoints are used:

- `/customer/car` - Get list of cars
- `/customer/car/{id}` - Get car details
- `/customer/car-brand` - Get car brands
- `/customer/car-type` - Get car types
- `/customer/booking` - Create and get bookings
- `/auth/login` - User login
- `/auth/register` - User registration

## Environment Setup

Make sure you have:
- Node.js installed
- Expo CLI installed globally: `npm install -g expo-cli`
- iOS Simulator (for Mac) or Android Emulator

## Notes

- The app uses Expo for easier development and deployment
- Date picker implementation may need platform-specific adjustments
- API endpoints may need to be adjusted based on actual API documentation
- Authentication token is stored securely using AsyncStorage

## License

This project is created for AsaanCar car rental service.

