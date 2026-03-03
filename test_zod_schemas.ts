import { loginSchema, registerSchema } from "./src/lib/schemas/auth";

console.log("--- TEST LOGIN SCHEMA ---");
const validLogin = loginSchema.safeParse({ email: "test@example.com", password: "password123" });
console.log("Valid Login:", validLogin.success);

const invalidLogin = loginSchema.safeParse({ email: "invalid-email", password: "123" });
console.log("Invalid Login (should be false):", invalidLogin.success);
if (!invalidLogin.success) console.log("Error Login:", invalidLogin.error.errors[0].message);

console.log("\n--- TEST REGISTER SCHEMA ---");
const validRegister = registerSchema.safeParse({
    email: "test@example.com",
    password: "password123",
    confirmPassword: "password123",
    displayName: "JP Test",
    phone: "123456789",
    accountType: "user"
});
console.log("Valid Register:", validRegister.success);

const invalidRegisterPassword = registerSchema.safeParse({
    email: "test@example.com",
    password: "password123",
    confirmPassword: "wrongpassword",
    displayName: "JP Test",
    phone: "123456789",
    accountType: "user"
});
console.log("Invalid Register - Passwords mismatch (should be false):", invalidRegisterPassword.success);
if (!invalidRegisterPassword.success) console.log("Error Register Passwords:", invalidRegisterPassword.error.errors[0].message);

const invalidRegisterAgency = registerSchema.safeParse({
    email: "test@example.com",
    password: "password123",
    confirmPassword: "password123",
    displayName: "JP Test",
    phone: "123456789",
    accountType: "agency",
    agencyName: "" // Empty agency name
});
console.log("Invalid Register - Missing Agency Name (should be false):", invalidRegisterAgency.success);
if (!invalidRegisterAgency.success) console.log("Error Register Agency:", invalidRegisterAgency.error.errors[0].message);
