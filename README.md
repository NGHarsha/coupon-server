# Coupon Validator Express Server

## Available Scripts

In the project directory, you can run:

### `npm dev`

Runs the app in the development mode on port 5000.

Use postman tool to hit REST endpoints.

### `npm start`

Launches the app in production mode.

### `Mongo Dependency`

This app uses mongodb for persistent storage of data, hence setting MONGODB_URI is mandatory before running the script.

## `Endpoints`
- ### GET /api/coupon/list
  Returns all available coupons.
- ### POST /api/coupon/create
  Requires a coupon object as data and creates coupon.
- ### POST /api/coupon/validate
  Validates coupon and returns discount if it is valid.
