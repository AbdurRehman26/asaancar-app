# Setup Instructions

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Development Server**
   ```bash
   npm start
   ```

3. **Run on Device/Emulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your phone

## Project Structure

```
asaancar-app/
├── App.js                    # Main app entry point
├── src/
│   ├── context/              # React Context providers
│   │   └── AuthContext.js   # Authentication state management
│   ├── navigation/          # Navigation configuration
│   │   └── AppNavigator.js  # Main navigation setup
│   ├── screens/             # Screen components
│   │   ├── HomeScreen.js
│   │   ├── CarDetailScreen.js
│   │   ├── BookingScreen.js
│   │   ├── MyBookingsScreen.js
│   │   ├── LoginScreen.js
│   │   ├── RegisterScreen.js
│   │   └── ProfileScreen.js
│   └── services/            # API and external services
│       └── api.js          # API client and endpoints
└── assets/                  # Images, icons, etc.
```

## Features Implemented

✅ Car browsing with filters (Brand, Type, Transmission, Fuel Type, Seats, Price)
✅ Car detail view
✅ Booking creation
✅ User authentication (Login/Register)
✅ My Bookings view
✅ User profile
✅ Responsive UI with modern design

## API Integration

The app connects to `https://asaancar.com/api` with the following endpoints:

- `GET /customer/car` - List cars with filters
- `GET /customer/car/{id}` - Get car details
- `GET /customer/car-brand` - Get car brands
- `GET /customer/car-type` - Get car types
- `POST /customer/booking` - Create booking
- `GET /customer/booking` - Get user bookings
- `POST /auth/login` - User login
- `POST /auth/register` - User registration

## Notes

- Authentication tokens are stored using AsyncStorage
- The app uses React Navigation for navigation
- Date picker works on both iOS and Android
- All API calls include error handling
- The UI follows the AsaanCar brand colors (#85ea2d)

## Troubleshooting

### Common Issues

1. **Module not found errors**: Run `npm install` again
2. **Metro bundler issues**: Clear cache with `npm start -- --reset-cache`
3. **Date picker not showing**: Ensure `@react-native-community/datetimepicker` is installed
4. **Vector icons not showing**: May need to link fonts (usually automatic with Expo)

## Next Steps

- Add image assets (icon, splash screen)
- Configure app.json with proper bundle identifiers
- Test API endpoints with actual backend
- Add error boundaries
- Implement offline support
- Add push notifications










