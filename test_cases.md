# Test Plan & Test Cases - Supermarket Chain Application

This document outlines the test plan and individual test cases for verifying the integration between the React frontend and Spring Boot backend.

---

## 1. Test Execution Instructions

### Run Backend
Navigate to the `backend` folder and start the Spring Boot service:
```bash
JAVA_HOME="/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home" ./mvnw spring-boot:run
```

### Run Frontend
Navigate to the `frontend` folder and start the Vite dev server:
```bash
npm run dev
```

---

## 2. Test Cases

### Test Suite 1: User Management (Staff & Customers)

#### TC-USER-01: User Self-Signup (Customer)
* **Goal**: Verify a guest user can register as a CUSTOMER and access the application.
* **Steps**:
  1. Open the signup form.
  2. Enter first name: `Jane`, last name: `Doe`, email: `jane.doe@gmail.com`, phone: `0771234567`, address: `No 45, Flower Road, Colombo`.
  3. Submit the form.
* **Expected Result**: 
  - Status code `201 Created` is returned by `/api/user/create`.
  - Toast notification "Account created for Jane!" appears.
  - User is logged in and redirected to home page.

#### TC-USER-02: User Login
* **Goal**: Verify users can login with registered credentials.
* **Steps**:
  1. Open the login form.
  2. Enter email: `admin@freshcart.com`.
  3. Click "Sign In".
* **Expected Result**:
  - Frontend matches email in loaded users list.
  - Redirects to `admin-dashboard` layout (Admin).

---

### Test Suite 2: Branch Management (Store Locations)

#### TC-BRANCH-01: Create a Store Branch
* **Goal**: Verify that an Admin can add a physical store location.
* **Steps**:
  1. Go to the Control Panel -> Branches tab.
  2. Click "Add Store Branch".
  3. Enter Name: `Kandy Supercentre`, Address: `10 Peradeniya Rd, Kandy`, Manager: `Jane Smith`, Hours: `08:00 AM - 10:00 PM`.
  4. Save the branch.
* **Expected Result**:
  - POST request `/api/branch/create` succeeds.
  - Branch appears in branches list.

#### TC-BRANCH-02: Delete/Archive Branch
* **Goal**: Verify that branches can be archived.
* **Steps**:
  1. Go to Branches list.
  2. Click the trash icon next to "Downtown Express".
* **Expected Result**:
  - DELETE `/api/branch/{branchId}` request succeeds.
  - Branch status changes to inactive / archived.

---

### Test Suite 3: Items & Inventory Management

#### TC-ITEM-01: Add Product to Catalog
* **Goal**: Verify that staff/admin can register a new catalog product with required parameters.
* **Steps**:
  1. Open Inventory Control Panel.
  2. Click "Add Product".
  3. Enter Name: `Fresh Avocados`, Category: `Produce`, Price: `4.50`, SKU: `PROD-AVO-991`, Image URL: https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=500, Stock: `150`.
  4. Submit.
* **Expected Result**:
  - POST `/api/item/create` succeeds with all fields populated.
  - Product appears in the public catalog.

---

### Test Suite 4: Checkout, Promotions & Payments

#### TC-PAY-01: Apply Coupon Code
* **Goal**: Verify that coupon promotions can be validated and applied.
* **Steps**:
  1. Add items to cart.
  2. Proceed to Checkout.
  3. Enter coupon code: `SAVE10`.
  4. Click "Apply".
* **Expected Result**:
  - Discount is calculated (10% off).
  - Subtotal and total updated dynamically.

#### TC-PAY-02: Complete Checkout with Cash / Card
* **Goal**: Verify order creation and transaction records on checkout.
* **Steps**:
  1. From Checkout page, select payment method: `Credit Card` or `Cash on Delivery`.
  2. Enter shipping address: `123 Main St`.
  3. Click "Place Order".
* **Expected Result**:
  - POST `/api/order/create` creates the order.
  - POST `/api/payment/create` records the transaction details.
  - Stock levels for purchased items are decremented.
