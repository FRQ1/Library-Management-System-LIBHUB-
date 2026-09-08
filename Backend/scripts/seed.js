require("dotenv").config();
const mongoose = require("mongoose");

const dbConnect = require("../config/db-connect");
const User = require("../models/user-model");
const Book = require("../models/book-model");
const Loan = require("../models/loan-model");
const Reservation = require("../models/reservation-model");

const TEST_USERS = [
  { name: "Ahmed Admin", email: "admin@libhub.com", password: "password123", role: "admin" },
  { name: "Layla Librarian", email: "librarian@libhub.com", password: "password123", role: "librarian" },
  { name: "Mona Member", email: "member@libhub.com", password: "password123", role: "member" },
];

const TEST_BOOKS = [
  { title: "Dune", author: "Frank Herbert", isbn: "9780441013593", category: "fiction", totalCopies: 3 },
  { title: "A Brief History of Time", author: "Stephen Hawking", isbn: "9780553380163", category: "science", totalCopies: 2 },
  { title: "Sapiens", author: "Yuval Noah Harari", isbn: "9780062316097", category: "history", totalCopies: 2 },
  { title: "Steve Jobs", author: "Walter Isaacson", isbn: "9781451648539", category: "biography", totalCopies: 1 },
  { title: "Clean Code", author: "Robert C. Martin", isbn: "9780132350884", category: "technology", totalCopies: 2 },
  { title: "The Name of the Wind", author: "Patrick Rothfuss", isbn: "9780756404741", category: "fantasy", totalCopies: 2 },
  { title: "The Hound of the Baskervilles", author: "Arthur Conan Doyle", isbn: "9780451528018", category: "mystery", totalCopies: 1 },
  { title: "Charlotte's Web", author: "E. B. White", isbn: "9780064400558", category: "children", totalCopies: 3 },
  { title: "Watchmen", author: "Alan Moore", isbn: "9781401245252", category: "comics", totalCopies: 1 },
];

const seed = async () => {
  await dbConnect();

  console.log("Clearing existing data...");
  await Promise.all([
    User.deleteMany({}),
    Book.deleteMany({}),
    Loan.deleteMany({}),
    Reservation.deleteMany({}),
  ]);

  console.log("Creating test accounts...");
  const users = await User.create(TEST_USERS);
  const admin = users.find((u) => u.role === "admin");
  const librarian = users.find((u) => u.role === "librarian");
  const member = users.find((u) => u.role === "member");

  console.log("Creating catalog...");
  const books = await Book.create(TEST_BOOKS);

  console.log("Creating a sample loan and a sample reservation...");
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14);

  await Loan.create({
    book: books[0]._id,
    member: member._id,
    checkedOutBy: librarian._id,
    dueDate,
  });
  books[0].availableCopies -= 1;
  await books[0].save();

  await Reservation.create({
    book: books[3]._id,
    member: member._id,
  });

  console.log("\nSeed complete. Test accounts:");
  console.log(`  Admin:     ${admin.email} / password123`);
  console.log(`  Librarian: ${librarian.email} / password123`);
  console.log(`  Member:    ${member.email} / password123`);

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
