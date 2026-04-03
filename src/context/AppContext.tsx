import React, { createContext, useContext, useReducer, ReactNode } from "react";
import { AppState, AppAction, Member, Household, FinancialRecord, SundaySchoolClass } from "../types";

// --- Sample Data ---

const sampleMembers: Member[] = [
  {
    id: "CHU-00001",
    title: "Mr.",
    firstName: "Kwame",
    lastName: "Mensah",
    otherNames: "",
    gender: "Male",
    dateOfBirth: "1980-05-15",
    placeOfBirth: "Accra",
    dayBorn: "Thursday",
    homeTown: "Kumasi",
    region: "Ashanti",
    country: "Ghana",
    languagesSpoken: "English, Twi",
    maritalStatus: "Married",
    typeOfMarriage: "Ordinance",
    dateOfMarriage: "2008-12-20",
    placeOfMarriage: "Accra",
    spouseName: "Ama Mensah",
    children: [
      { name: "Kofi Mensah", dateOfBirth: "2012-03-10", placeOfBirth: "Accra" }
    ],
    father: { name: "Yaw Mensah", isAlive: true, phone: "+233 24 000 0001" },
    mother: { name: "Abena Mensah", isAlive: true, phone: "+233 24 000 0002" },
    nextOfKin: "Ama Mensah",
    nextOfKinPhone: "+233 24 123 4568",
    contactPersonFamilyName: "Yaw Mensah",
    contactPersonFamilyTel: "+233 24 000 0001",
    educationLevel: "University",
    occupationProfession: "Engineer",
    membershipDate: "2010-01-01",
    groupMinistry: "Men's Fellowship",
    generalGroup: "Group A",
    position: "Member",
    effectiveDate: "2010-01-01",
    relDenomination: "Presbyterian",
    isBaptized: true,
    isCommunicant: true,
    baptismDate: "1980-08-15",
    baptismPlace: "Kumasi",
    baptismMinisterName: "Rev. Osei",
    confirmationDate: "1995-05-20",
    confirmationPlace: "Kumasi",
    confirmationMinisterName: "Rev. Osei",
    housePhoneNumber: "",
    cellPhoneNumber: "+233 24 123 4567",
    email: "kwame.mensah@example.com",
    residenceArea: "Airport Residential",
    address: "123 Independence Ave, Accra",
    postalAddress: "P.O. Box 123, Accra",
    membershipStatus: "Active",
    householdId: "FAM-001",
    role: "Head of Household",
    department: "Elders",
    photo: "https://picsum.photos/seed/kwame/200",
    phone: "+233 24 123 4567"
  },
  {
    id: "CHU-00002",
    title: "Mrs.",
    firstName: "Ama",
    lastName: "Mensah",
    otherNames: "",
    gender: "Female",
    dateOfBirth: "1985-08-20",
    placeOfBirth: "Kumasi",
    dayBorn: "Tuesday",
    homeTown: "Kumasi",
    region: "Ashanti",
    country: "Ghana",
    languagesSpoken: "English, Twi",
    maritalStatus: "Married",
    typeOfMarriage: "Ordinance",
    dateOfMarriage: "2008-12-20",
    placeOfMarriage: "Accra",
    spouseName: "Kwame Mensah",
    children: [
      { name: "Kofi Mensah", dateOfBirth: "2012-03-10", placeOfBirth: "Accra" }
    ],
    father: { name: "Kofi Antwi", isAlive: true, phone: "+233 24 000 0003" },
    mother: { name: "Efua Antwi", isAlive: true, phone: "+233 24 000 0004" },
    nextOfKin: "Kwame Mensah",
    nextOfKinPhone: "+233 24 123 4567",
    contactPersonFamilyName: "Kofi Antwi",
    contactPersonFamilyTel: "+233 24 000 0003",
    educationLevel: "University",
    occupationProfession: "Teacher",
    membershipDate: "2010-01-01",
    groupMinistry: "Women's Fellowship",
    generalGroup: "Group A",
    position: "Secretary",
    effectiveDate: "2012-01-01",
    relDenomination: "Presbyterian",
    isBaptized: true,
    isCommunicant: true,
    baptismDate: "1985-11-20",
    baptismPlace: "Kumasi",
    baptismMinisterName: "Rev. Osei",
    confirmationDate: "2000-06-15",
    confirmationPlace: "Kumasi",
    confirmationMinisterName: "Rev. Osei",
    housePhoneNumber: "",
    cellPhoneNumber: "+233 24 123 4568",
    email: "ama.mensah@example.com",
    residenceArea: "Airport Residential",
    address: "123 Independence Ave, Accra",
    postalAddress: "P.O. Box 123, Accra",
    membershipStatus: "Active",
    householdId: "FAM-001",
    role: "Spouse",
    department: "Choir",
    photo: "https://picsum.photos/seed/ama/200",
    phone: "+233 24 123 4568"
  },
  {
    id: "CHU-00003",
    title: "Master",
    firstName: "Kofi",
    lastName: "Mensah",
    otherNames: "",
    gender: "Male",
    dateOfBirth: "2012-03-10",
    placeOfBirth: "Accra",
    dayBorn: "Saturday",
    homeTown: "Kumasi",
    region: "Ashanti",
    country: "Ghana",
    languagesSpoken: "English, Twi",
    maritalStatus: "Single",
    typeOfMarriage: "",
    dateOfMarriage: "",
    placeOfMarriage: "",
    spouseName: "",
    children: [],
    father: { name: "Kwame Mensah", isAlive: true, phone: "+233 24 123 4567" },
    mother: { name: "Ama Mensah", isAlive: true, phone: "+233 24 123 4568" },
    nextOfKin: "Kwame Mensah",
    nextOfKinPhone: "+233 24 123 4567",
    contactPersonFamilyName: "Kwame Mensah",
    contactPersonFamilyTel: "+233 24 123 4567",
    educationLevel: "Primary",
    occupationProfession: "Student",
    membershipDate: "2012-05-01",
    groupMinistry: "Children's Ministry",
    generalGroup: "Group A",
    position: "Member",
    effectiveDate: "2012-05-01",
    relDenomination: "Presbyterian",
    isBaptized: true,
    isCommunicant: false,
    baptismDate: "2012-06-10",
    baptismPlace: "Accra",
    baptismMinisterName: "Rev. Mensah",
    confirmationDate: "",
    confirmationPlace: "",
    confirmationMinisterName: "",
    housePhoneNumber: "",
    cellPhoneNumber: "N/A",
    email: "N/A",
    residenceArea: "Airport Residential",
    address: "123 Independence Ave, Accra",
    postalAddress: "P.O. Box 123, Accra",
    membershipStatus: "Active",
    householdId: "FAM-001",
    role: "Child",
    department: "Youth",
    photo: "https://picsum.photos/seed/kofi/200",
    phone: "N/A"
  },
  {
    id: "CHU-00004",
    title: "Mr.",
    firstName: "John",
    lastName: "Doe",
    otherNames: "",
    gender: "Male",
    dateOfBirth: "1975-11-05",
    placeOfBirth: "London",
    dayBorn: "Wednesday",
    homeTown: "London",
    region: "Greater London",
    country: "UK",
    languagesSpoken: "English",
    maritalStatus: "Married",
    typeOfMarriage: "Ordinance",
    dateOfMarriage: "2000-05-15",
    placeOfMarriage: "London",
    spouseName: "Jane Doe",
    children: [],
    father: { name: "Robert Doe", isAlive: false, phone: "" },
    mother: { name: "Mary Doe", isAlive: true, phone: "+44 20 1234 5678" },
    nextOfKin: "Jane Doe",
    nextOfKinPhone: "+233 20 987 6544",
    contactPersonFamilyName: "Jane Doe",
    contactPersonFamilyTel: "+233 20 987 6544",
    educationLevel: "Post-Graduate",
    occupationProfession: "Consultant",
    membershipDate: "2015-06-15",
    groupMinistry: "Men's Fellowship",
    generalGroup: "Group B",
    position: "Leader",
    effectiveDate: "2017-01-01",
    relDenomination: "Anglican",
    isBaptized: true,
    isCommunicant: true,
    baptismDate: "1976-01-05",
    baptismPlace: "London",
    baptismMinisterName: "Rev. Smith",
    confirmationDate: "1990-04-10",
    confirmationPlace: "London",
    confirmationMinisterName: "Rev. Smith",
    housePhoneNumber: "+233 30 222 3333",
    cellPhoneNumber: "+233 20 987 6543",
    email: "john.doe@example.com",
    residenceArea: "Osu",
    address: "45 Osu St, Accra",
    postalAddress: "P.O. Box 456, Accra",
    membershipStatus: "Active",
    householdId: "FAM-002",
    role: "Head of Household",
    department: "Ushers",
    photo: "https://picsum.photos/seed/john/200",
    phone: "+233 20 987 6543"
  },
  {
    id: "CHU-00005",
    title: "Mrs.",
    firstName: "Jane",
    lastName: "Doe",
    otherNames: "",
    gender: "Female",
    dateOfBirth: "1978-02-14",
    placeOfBirth: "Accra",
    dayBorn: "Tuesday",
    homeTown: "Accra",
    region: "Greater Accra",
    country: "Ghana",
    languagesSpoken: "English, Ga",
    maritalStatus: "Married",
    typeOfMarriage: "Ordinance",
    dateOfMarriage: "2000-05-15",
    placeOfMarriage: "London",
    spouseName: "John Doe",
    children: [],
    father: { name: "Samuel Lartey", isAlive: true, phone: "+233 24 111 2222" },
    mother: { name: "Martha Lartey", isAlive: true, phone: "+233 24 111 2223" },
    nextOfKin: "John Doe",
    nextOfKinPhone: "+233 20 987 6543",
    contactPersonFamilyName: "Samuel Lartey",
    contactPersonFamilyTel: "+233 24 111 2222",
    educationLevel: "University",
    occupationProfession: "Nurse",
    membershipDate: "2015-06-15",
    groupMinistry: "Women's Fellowship",
    generalGroup: "Group B",
    position: "Member",
    effectiveDate: "2015-06-15",
    relDenomination: "Methodist",
    isBaptized: true,
    isCommunicant: true,
    baptismDate: "1978-05-14",
    baptismPlace: "Accra",
    baptismMinisterName: "Rev. Lartey",
    confirmationDate: "1993-06-20",
    confirmationPlace: "Accra",
    confirmationMinisterName: "Rev. Lartey",
    housePhoneNumber: "+233 30 222 3333",
    cellPhoneNumber: "+233 20 987 6544",
    email: "jane.doe@example.com",
    residenceArea: "Osu",
    address: "45 Osu St, Accra",
    postalAddress: "P.O. Box 456, Accra",
    membershipStatus: "Active",
    householdId: "FAM-002",
    role: "Spouse",
    department: "Women's Ministry",
    photo: "https://picsum.photos/seed/jane/200",
    phone: "+233 20 987 6544"
  },
  {
    id: "CHU-00006",
    title: "Mr.",
    firstName: "Samuel",
    lastName: "Osei",
    otherNames: "",
    gender: "Male",
    dateOfBirth: "1990-09-25",
    placeOfBirth: "Kumasi",
    dayBorn: "Tuesday",
    homeTown: "Kumasi",
    region: "Ashanti",
    country: "Ghana",
    languagesSpoken: "English, Twi",
    maritalStatus: "Married",
    typeOfMarriage: "Customary",
    dateOfMarriage: "2018-01-10",
    placeOfMarriage: "Kumasi",
    spouseName: "Sarah Osei",
    children: [],
    father: { name: "Osei Tutu", isAlive: true, phone: "+233 24 333 4444" },
    mother: { name: "Abena Osei", isAlive: true, phone: "+233 24 333 4445" },
    nextOfKin: "Sarah Osei",
    nextOfKinPhone: "+233 55 555 1235",
    contactPersonFamilyName: "Osei Tutu",
    contactPersonFamilyTel: "+233 24 333 4444",
    educationLevel: "University",
    occupationProfession: "IT Specialist",
    membershipDate: "2018-01-20",
    groupMinistry: "Youth Ministry",
    generalGroup: "Group C",
    position: "Media Lead",
    effectiveDate: "2019-01-01",
    relDenomination: "Presbyterian",
    isBaptized: true,
    isCommunicant: true,
    baptismDate: "1990-12-25",
    baptismPlace: "Kumasi",
    baptismMinisterName: "Rev. Osei",
    confirmationDate: "2005-08-15",
    confirmationPlace: "Kumasi",
    confirmationMinisterName: "Rev. Osei",
    housePhoneNumber: "",
    cellPhoneNumber: "+233 55 555 1234",
    email: "sam.osei@example.com",
    residenceArea: "Ring Road",
    address: "78 Ring Road, Accra",
    postalAddress: "P.O. Box 789, Accra",
    membershipStatus: "Active",
    householdId: "FAM-003",
    role: "Head of Household",
    department: "Media",
    photo: "https://picsum.photos/seed/sam/200",
    phone: "+233 55 555 1234"
  },
  {
    id: "CHU-00007",
    title: "Mrs.",
    firstName: "Sarah",
    lastName: "Osei",
    otherNames: "",
    gender: "Female",
    dateOfBirth: "1992-12-12",
    placeOfBirth: "Sunyani",
    dayBorn: "Saturday",
    homeTown: "Sunyani",
    region: "Bono",
    country: "Ghana",
    languagesSpoken: "English, Twi",
    maritalStatus: "Married",
    typeOfMarriage: "Customary",
    dateOfMarriage: "2018-01-10",
    placeOfMarriage: "Kumasi",
    spouseName: "Samuel Osei",
    children: [],
    father: { name: "Kofi Boateng", isAlive: true, phone: "+233 24 555 6666" },
    mother: { name: "Mary Boateng", isAlive: true, phone: "+233 24 555 6667" },
    nextOfKin: "Samuel Osei",
    nextOfKinPhone: "+233 55 555 1234",
    contactPersonFamilyName: "Kofi Boateng",
    contactPersonFamilyTel: "+233 24 555 6666",
    educationLevel: "University",
    occupationProfession: "Accountant",
    membershipDate: "2018-01-20",
    groupMinistry: "Women's Fellowship",
    generalGroup: "Group C",
    position: "Member",
    effectiveDate: "2018-01-20",
    relDenomination: "Presbyterian",
    isBaptized: true,
    isCommunicant: true,
    baptismDate: "1993-03-12",
    baptismPlace: "Sunyani",
    baptismMinisterName: "Rev. Boateng",
    confirmationDate: "2008-09-20",
    confirmationPlace: "Sunyani",
    confirmationMinisterName: "Rev. Boateng",
    housePhoneNumber: "",
    cellPhoneNumber: "+233 55 555 1235",
    email: "sarah.osei@example.com",
    residenceArea: "Ring Road",
    address: "78 Ring Road, Accra",
    postalAddress: "P.O. Box 789, Accra",
    membershipStatus: "Active",
    householdId: "FAM-003",
    role: "Spouse",
    department: "Children's Ministry",
    photo: "https://picsum.photos/seed/sarah/200",
    phone: "+233 55 555 1235"
  },
  {
    id: "CHU-00008",
    title: "Mr.",
    firstName: "Emmanuel",
    lastName: "Appiah",
    otherNames: "",
    gender: "Male",
    dateOfBirth: "1982-04-30",
    placeOfBirth: "Cape Coast",
    dayBorn: "Friday",
    homeTown: "Cape Coast",
    region: "Central",
    country: "Ghana",
    languagesSpoken: "English, Fante",
    maritalStatus: "Married",
    typeOfMarriage: "Ordinance",
    dateOfMarriage: "2010-06-12",
    placeOfMarriage: "Cape Coast",
    spouseName: "Grace Appiah",
    children: [
      { name: "David Appiah", dateOfBirth: "2015-01-01", placeOfBirth: "Accra" }
    ],
    father: { name: "John Appiah", isAlive: true, phone: "+233 24 777 8888" },
    mother: { name: "Elizabeth Appiah", isAlive: true, phone: "+233 24 777 8889" },
    nextOfKin: "Grace Appiah",
    nextOfKinPhone: "+233 27 111 2223",
    contactPersonFamilyName: "John Appiah",
    contactPersonFamilyTel: "+233 24 777 8888",
    educationLevel: "University",
    occupationProfession: "Banker",
    membershipDate: "2012-11-10",
    groupMinistry: "Men's Fellowship",
    generalGroup: "Group D",
    position: "Member",
    effectiveDate: "2012-11-10",
    relDenomination: "Methodist",
    isBaptized: true,
    isCommunicant: true,
    baptismDate: "1982-07-30",
    baptismPlace: "Cape Coast",
    baptismMinisterName: "Rev. Appiah",
    confirmationDate: "1997-08-15",
    confirmationPlace: "Cape Coast",
    confirmationMinisterName: "Rev. Appiah",
    housePhoneNumber: "",
    cellPhoneNumber: "+233 27 111 2222",
    email: "emma.appiah@example.com",
    residenceArea: "Airport Residential",
    address: "12 Airport Residential, Accra",
    postalAddress: "P.O. Box 101, Accra",
    membershipStatus: "Active",
    householdId: "FAM-004",
    role: "Head of Household",
    department: "Evangelism",
    photo: "https://picsum.photos/seed/emma/200",
    phone: "+233 27 111 2222"
  },
  {
    id: "CHU-00009",
    title: "Mrs.",
    firstName: "Grace",
    lastName: "Appiah",
    otherNames: "",
    gender: "Female",
    dateOfBirth: "1986-07-07",
    placeOfBirth: "Accra",
    dayBorn: "Monday",
    homeTown: "Accra",
    region: "Greater Accra",
    country: "Ghana",
    languagesSpoken: "English, Ga",
    maritalStatus: "Married",
    typeOfMarriage: "Ordinance",
    dateOfMarriage: "2010-06-12",
    placeOfMarriage: "Cape Coast",
    spouseName: "Emmanuel Appiah",
    children: [
      { name: "David Appiah", dateOfBirth: "2015-01-01", placeOfBirth: "Accra" }
    ],
    father: { name: "Samuel Quaye", isAlive: true, phone: "+233 24 999 0000" },
    mother: { name: "Rebecca Quaye", isAlive: true, phone: "+233 24 999 0001" },
    nextOfKin: "Emmanuel Appiah",
    nextOfKinPhone: "+233 27 111 2222",
    contactPersonFamilyName: "Samuel Quaye",
    contactPersonFamilyTel: "+233 24 999 0000",
    educationLevel: "University",
    occupationProfession: "Pharmacist",
    membershipDate: "2012-11-10",
    groupMinistry: "Women's Fellowship",
    generalGroup: "Group D",
    position: "Member",
    effectiveDate: "2012-11-10",
    relDenomination: "Methodist",
    isBaptized: true,
    isCommunicant: true,
    baptismDate: "1986-10-07",
    baptismPlace: "Accra",
    baptismMinisterName: "Rev. Quaye",
    confirmationDate: "2001-09-15",
    confirmationPlace: "Accra",
    confirmationMinisterName: "Rev. Quaye",
    housePhoneNumber: "",
    cellPhoneNumber: "+233 27 111 2223",
    email: "grace.appiah@example.com",
    residenceArea: "Airport Residential",
    address: "12 Airport Residential, Accra",
    postalAddress: "P.O. Box 101, Accra",
    membershipStatus: "Active",
    householdId: "FAM-004",
    role: "Spouse",
    department: "Prayer Warriors",
    photo: "https://picsum.photos/seed/grace/200",
    phone: "+233 27 111 2223"
  },
  {
    id: "CHU-00010",
    title: "Master",
    firstName: "David",
    lastName: "Appiah",
    otherNames: "",
    gender: "Male",
    dateOfBirth: "2015-01-01",
    placeOfBirth: "Accra",
    dayBorn: "Thursday",
    homeTown: "Cape Coast",
    region: "Central",
    country: "Ghana",
    languagesSpoken: "English",
    maritalStatus: "Single",
    typeOfMarriage: "",
    dateOfMarriage: "",
    placeOfMarriage: "",
    spouseName: "",
    children: [],
    father: { name: "Emmanuel Appiah", isAlive: true, phone: "+233 27 111 2222" },
    mother: { name: "Grace Appiah", isAlive: true, phone: "+233 27 111 2223" },
    nextOfKin: "Emmanuel Appiah",
    nextOfKinPhone: "+233 27 111 2222",
    contactPersonFamilyName: "Emmanuel Appiah",
    contactPersonFamilyTel: "+233 27 111 2222",
    educationLevel: "Primary",
    occupationProfession: "Student",
    membershipDate: "2015-03-01",
    groupMinistry: "Children's Ministry",
    generalGroup: "Group D",
    position: "Member",
    effectiveDate: "2015-03-01",
    relDenomination: "Methodist",
    isBaptized: true,
    isCommunicant: false,
    baptismDate: "2015-04-01",
    baptismPlace: "Accra",
    baptismMinisterName: "Rev. Appiah",
    confirmationDate: "",
    confirmationPlace: "",
    confirmationMinisterName: "",
    housePhoneNumber: "",
    cellPhoneNumber: "N/A",
    email: "N/A",
    residenceArea: "Airport Residential",
    address: "12 Airport Residential, Accra",
    postalAddress: "P.O. Box 101, Accra",
    membershipStatus: "Active",
    householdId: "FAM-004",
    role: "Child",
    department: "Children's Ministry",
    photo: "https://picsum.photos/seed/david/200",
    phone: "N/A"
  }
];

const sampleHouseholds: Household[] = [
  {
    householdId: "FAM-001",
    householdName: "The Mensah Family",
    members: ["CHU-00001", "CHU-00002", "CHU-00003"]
  },
  {
    householdId: "FAM-002",
    householdName: "The Doe Family",
    members: ["CHU-00004", "CHU-00005"]
  },
  {
    householdId: "FAM-003",
    householdName: "The Osei Family",
    members: ["CHU-00006", "CHU-00007"]
  },
  {
    householdId: "FAM-004",
    householdName: "The Appiah Family",
    members: ["CHU-00008", "CHU-00009", "CHU-00010"]
  }
];

const sampleFinancialRecords: FinancialRecord[] = [
  {
    id: "FIN-001",
    memberId: "CHU-00001",
    memberName: "Kwame Mensah",
    type: "Tithe",
    amount: 500,
    currency: "GHS",
    date: "2024-03-01",
    notes: "Monthly tithe"
  },
  {
    id: "FIN-002",
    memberId: "CHU-00002",
    memberName: "Ama Mensah",
    type: "Offering",
    amount: 50,
    currency: "GHS",
    date: "2024-03-03",
    notes: "Sunday offering"
  },
  {
    id: "FIN-003",
    memberId: "CHU-00004",
    memberName: "John Doe",
    type: "Pledge",
    amount: 1000,
    currency: "GHS",
    date: "2024-03-05",
    pledgeStatus: "Partial",
    pledgeTargetAmount: 5000,
    notes: "Building project pledge"
  },
  {
    id: "FIN-004",
    memberId: "CHU-00006",
    memberName: "Samuel Osei",
    type: "Donation",
    amount: 200,
    currency: "USD",
    date: "2024-03-10",
    notes: "Special donation for media equipment"
  }
];

const sampleSundaySchoolClasses: SundaySchoolClass[] = [
  {
    classId: "SSC-001",
    className: "Adult Bible Study",
    teacherMemberId: "CHU-00001",
    ageGroup: "Adults",
    members: ["CHU-00004", "CHU-00006", "CHU-00008"],
    meetingDay: "Sunday",
    meetingTime: "08:00 AM"
  },
  {
    classId: "SSC-002",
    className: "Youth Group",
    teacherMemberId: "CHU-00007",
    ageGroup: "Youth",
    members: ["CHU-00003"],
    meetingDay: "Saturday",
    meetingTime: "04:00 PM"
  },
  {
    classId: "SSC-003",
    className: "Children's Class",
    teacherMemberId: "CHU-00009",
    ageGroup: "Children",
    members: ["CHU-00010"],
    meetingDay: "Sunday",
    meetingTime: "09:00 AM"
  }
];

// --- Context & Reducer ---

const initialState: AppState = {
  members: sampleMembers,
  households: sampleHouseholds,
  financialRecords: sampleFinancialRecords,
  sundaySchoolClasses: sampleSundaySchoolClasses
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_MEMBERS":
      return { ...state, members: action.payload };
    case "ADD_MEMBER":
      return { ...state, members: [...state.members, action.payload] };
    case "UPDATE_MEMBER":
      return {
        ...state,
        members: state.members.map((m) =>
          m.id === action.payload.id ? action.payload : m
        )
      };
    case "DELETE_MEMBER":
      return {
        ...state,
        members: state.members.filter((m) => m.id !== action.payload)
      };
    case "SET_HOUSEHOLDS":
      return { ...state, households: action.payload };
    case "ADD_HOUSEHOLD":
      return { ...state, households: [...state.households, action.payload] };
    case "UPDATE_HOUSEHOLD":
      return {
        ...state,
        households: state.households.map((h) =>
          h.householdId === action.payload.householdId ? action.payload : h
        )
      };
    case "DELETE_HOUSEHOLD":
      return {
        ...state,
        households: state.households.filter((h) => h.householdId !== action.payload)
      };
    case "SET_FINANCIAL_RECORDS":
      return { ...state, financialRecords: action.payload };
    case "ADD_FINANCIAL_RECORD":
      return { ...state, financialRecords: [...state.financialRecords, action.payload] };
    case "UPDATE_FINANCIAL_RECORD":
      return {
        ...state,
        financialRecords: state.financialRecords.map((r) =>
          r.id === action.payload.id ? action.payload : r
        )
      };
    case "DELETE_FINANCIAL_RECORD":
      return {
        ...state,
        financialRecords: state.financialRecords.filter((r) => r.id !== action.payload)
      };
    case "SET_SUNDAY_SCHOOL_CLASSES":
      return { ...state, sundaySchoolClasses: action.payload };
    case "ADD_SUNDAY_SCHOOL_CLASS":
      return { ...state, sundaySchoolClasses: [...state.sundaySchoolClasses, action.payload] };
    case "UPDATE_SUNDAY_SCHOOL_CLASS":
      return {
        ...state,
        sundaySchoolClasses: state.sundaySchoolClasses.map((c) =>
          c.classId === action.payload.classId ? action.payload : c
        )
      };
    case "DELETE_SUNDAY_SCHOOL_CLASS":
      return {
        ...state,
        sundaySchoolClasses: state.sundaySchoolClasses.filter((c) => c.classId !== action.payload)
      };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
