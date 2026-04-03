export type Gender = "Male" | "Female";
export type MembershipStatus = "Active" | "Inactive" | "Visitor" | "Deceased";
export type HouseholdRole = "Head of Household" | "Spouse" | "Child" | "Other";
export type FinancialRecordType = "Tithe" | "Offering" | "Pledge" | "Pledge Payment" | "Commitment" | "Donation" | "Other";
export type Currency = "GHS" | "USD" | "GBP";
export type PledgeStatus = "Fulfilled" | "Pending" | "Partial";
export type AgeGroup = "Children" | "Youth" | "Young Adults" | "Adults" | "Seniors";

export interface MemberChild {
  name: string;
  dateOfBirth: string;
  placeOfBirth: string;
}

export interface MemberParent {
  name: string;
  isAlive: boolean;
  phone: string;
}

export interface Member {
  id: string;
  title: string;
  firstName: string; // Mapping to Other Names
  lastName: string; // Mapping to Surname
  otherNames: string;
  gender: Gender;
  dateOfBirth: string;
  placeOfBirth: string;
  dayBorn: string;
  homeTown: string;
  region: string;
  country: string;
  languagesSpoken: string;
  
  // Family Details
  maritalStatus: string;
  typeOfMarriage: string;
  dateOfMarriage: string;
  placeOfMarriage: string;
  spouseName: string;
  children: MemberChild[];
  
  father: MemberParent;
  mother: MemberParent;
  
  nextOfKin: string;
  nextOfKinPhone: string;
  contactPersonFamilyName: string;
  contactPersonFamilyTel: string;
  
  // Education/Professional Details
  educationLevel: string;
  occupationProfession: string;
  
  // Membership details
  membershipDate: string;
  groupMinistry: string;
  generalGroup: string;
  position: string;
  effectiveDate: string;
  relDenomination: string;
  isBaptized: boolean;
  isCommunicant: boolean;
  baptismDate: string;
  baptismPlace: string;
  baptismMinisterName: string;
  confirmationDate: string;
  confirmationPlace: string;
  confirmationMinisterName: string;
  
  // Contact Details
  housePhoneNumber: string;
  cellPhoneNumber: string;
  email: string;
  residenceArea: string;
  address: string; // Mapping to Residence Address
  gpsAddress?: string;
  postalAddress: string;
  
  membershipStatus: MembershipStatus;
  householdId: string;
  role: HouseholdRole;
  department: string;
  photo?: string;
  phone: string; // Keeping for backward compatibility or as primary contact
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  entityType: "MEMBER" | "FINANCIAL" | "HOUSEHOLD" | "CLASS" | "GROUP";
  entityId: string;
  details: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

export interface Household {
  householdId: string;
  householdName: string;
  members: string[]; // array of Member IDs
}

export interface FinancialCampaign {
  id: string;
  name: string;
  targetAmount: number;
  currency: Currency;
  description: string;
  dueDate: string;
  endDate?: string;
  status: "Active" | "Completed" | "Cancelled";
  createdAt: string;
}

export interface FinancialRecord {
  id: string;
  memberId: string;
  memberName: string;
  type: FinancialRecordType;
  amount: number;
  currency: Currency;
  date: string;
  pledgeStatus?: PledgeStatus; // for pledges only
  pledgeTargetAmount?: number; // for pledges only
  pledgeDueDate?: string; // for pledges only
  pledgeId?: string; // for pledge payments, links to the original pledge record
  campaignId?: string; // links to FinancialCampaign
  campaignName?: string; // e.g., "Chapel Project"
  notes: string;
}

export interface SundaySchoolClass {
  classId: string;
  className: string;
  teacherMemberId: string;
  ageGroup: AgeGroup;
  members: string[]; // array of Member IDs
  meetingDay: string;
  meetingTime: string;
  description?: string;
}

export interface AppState {
  members: Member[];
  households: Household[];
  financialRecords: FinancialRecord[];
  sundaySchoolClasses: SundaySchoolClass[];
}

export type AppAction =
  | { type: "SET_MEMBERS"; payload: Member[] }
  | { type: "ADD_MEMBER"; payload: Member }
  | { type: "UPDATE_MEMBER"; payload: Member }
  | { type: "DELETE_MEMBER"; payload: string }
  | { type: "SET_HOUSEHOLDS"; payload: Household[] }
  | { type: "ADD_HOUSEHOLD"; payload: Household }
  | { type: "UPDATE_HOUSEHOLD"; payload: Household }
  | { type: "DELETE_HOUSEHOLD"; payload: string }
  | { type: "SET_FINANCIAL_RECORDS"; payload: FinancialRecord[] }
  | { type: "ADD_FINANCIAL_RECORD"; payload: FinancialRecord }
  | { type: "UPDATE_FINANCIAL_RECORD"; payload: FinancialRecord }
  | { type: "DELETE_FINANCIAL_RECORD"; payload: string }
  | { type: "SET_SUNDAY_SCHOOL_CLASSES"; payload: SundaySchoolClass[] }
  | { type: "ADD_SUNDAY_SCHOOL_CLASS"; payload: SundaySchoolClass }
  | { type: "UPDATE_SUNDAY_SCHOOL_CLASS"; payload: SundaySchoolClass }
  | { type: "DELETE_SUNDAY_SCHOOL_CLASS"; payload: string };
