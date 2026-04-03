import React from "react";
import { Member, Household } from "../types";
import { format } from "date-fns";

interface MemberPdfTemplateProps {
  member: Member;
  household?: Household;
}

export const MemberPdfTemplate: React.FC<MemberPdfTemplateProps> = ({ member, household }) => {
  const InfoSection = ({ title, children, icon: Icon }: { title: string; children: React.ReactNode; icon?: any }) => (
    <div className="mb-3 break-inside-avoid">
      <div className="flex items-center gap-2 mb-1.5 border-b pb-0.5 border-gray-200">
        {Icon && <Icon className="w-3.5 h-3.5 text-blue-600" />}
        <h3 className="text-[11px] font-bold text-gray-800 uppercase tracking-wide">{title}</h3>
      </div>
      <div className="grid grid-cols-4 gap-x-3 gap-y-1.5">
        {children}
      </div>
    </div>
  );

  const InfoField = ({ label, value, className = "" }: { label: string; value?: string | number | boolean | null; className?: string }) => (
    <div className={`flex flex-col ${className}`}>
      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-0.5">{label}</span>
      <span className="text-[10px] font-medium text-gray-900 leading-tight">
        {value === true ? "Yes" : value === false ? "No" : value || "N/A"}
      </span>
    </div>
  );

  return (
    <div id={`member-pdf-${member.id}`} className="p-6 w-[800px] bg-white text-black font-sans">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-100">
        <div className="flex gap-4 items-center">
          <div className="w-16 h-16 rounded-lg border border-gray-200 overflow-hidden shadow-sm bg-gray-50 flex items-center justify-center">
            {member.photo ? (
              <img src={member.photo} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="text-gray-300">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            )}
          </div>
          <div>
            <h1 className="text-lg font-black text-gray-900 leading-tight">
              {member.title} {member.firstName} {member.lastName}
            </h1>
            {member.otherNames && (
              <p className="text-[10px] text-gray-500 font-medium -mt-0.5">Other Names: {member.otherNames}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[9px] font-bold uppercase tracking-wider">
                ID: {member.id}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                member.membershipStatus === "Active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
              }`}>
                {member.membershipStatus}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-base font-black text-blue-600 leading-none">GLOBAL EVANGELICAL CHURCH</h2>
          <p className="text-[10px] font-bold text-gray-500 mt-0.5">ASHALEY BOTWE/OGBOJO</p>
          <p className="text-[9px] text-gray-400">P.O.BOX AF 1463, ADENTA</p>
          <p className="text-[8px] text-gray-400 mt-0.5">Printed: {format(new Date(), "PPpp")}</p>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="space-y-0.5">
        <InfoSection title="Personal Details">
          <InfoField label="Gender" value={member.gender} />
          <InfoField label="DOB" value={member.dateOfBirth} />
          <InfoField label="Place of Birth" value={member.placeOfBirth} />
          <InfoField label="Day Born" value={member.dayBorn} />
          <InfoField label="Home Town" value={member.homeTown} />
          <InfoField label="Region" value={member.region} />
          <InfoField label="Country" value={member.country} />
          <div className="col-span-4">
            <InfoField label="Languages Spoken" value={member.languagesSpoken} />
          </div>
        </InfoSection>

        <InfoSection title="Family & Marriage">
          <InfoField label="Marital Status" value={member.maritalStatus} />
          <InfoField label="Marriage Type" value={member.typeOfMarriage} />
          <InfoField label="Marriage Date" value={member.dateOfMarriage} />
          <InfoField label="Marriage Place" value={member.placeOfMarriage} />
          <div className="col-span-2">
            <InfoField label="Spouse Name" value={member.spouseName} />
          </div>
        </InfoSection>

        <InfoSection title="Parents Information">
          <InfoField label="Father's Name" value={member.father?.name} />
          <InfoField label="Father Status" value={member.father?.isAlive ? "Alive" : "Deceased"} />
          <InfoField label="Father Phone" value={member.father?.phone} />
          <div className="col-span-1"></div>
          <InfoField label="Mother's Name" value={member.mother?.name} />
          <InfoField label="Mother Status" value={member.mother?.isAlive ? "Alive" : "Deceased"} />
          <InfoField label="Mother Phone" value={member.mother?.phone} />
        </InfoSection>

        <InfoSection title="Emergency Contacts">
          <InfoField label="Next of Kin" value={member.nextOfKin} />
          <InfoField label="Next of Kin Phone" value={member.nextOfKinPhone} />
          <InfoField label="Family Contact" value={member.contactPersonFamilyName} />
          <InfoField label="Family Contact Tel" value={member.contactPersonFamilyTel} />
        </InfoSection>

        <InfoSection title="Education & Work">
          <div className="col-span-2">
            <InfoField label="Education Level" value={member.educationLevel} />
          </div>
          <div className="col-span-2">
            <InfoField label="Occupation / Profession" value={member.occupationProfession} />
          </div>
        </InfoSection>

        <InfoSection title="Church Membership">
          <InfoField label="Joined Date" value={member.membershipDate} />
          <InfoField label="Effective Date" value={member.effectiveDate} />
          <InfoField label="Group/Ministry" value={member.groupMinistry} />
          <InfoField label="General Group" value={member.generalGroup} />
          <InfoField label="Position" value={member.position} />
          <InfoField label="Household Role" value={member.role} />
          <div className="col-span-2">
            <InfoField label="Previous Denomination" value={member.relDenomination} />
          </div>
        </InfoSection>

        <InfoSection title="Sacraments">
          <InfoField label="Baptized" value={member.isBaptized} />
          <InfoField label="Baptism Date" value={member.baptismDate} />
          <InfoField label="Baptism Place" value={member.baptismPlace} />
          <InfoField label="Baptism Minister" value={member.baptismMinisterName} />
          <InfoField label="Communicant" value={member.isCommunicant} />
          <InfoField label="Confirmation Date" value={member.confirmationDate} />
          <InfoField label="Confirmation Place" value={member.confirmationPlace} />
          <InfoField label="Confirmation Minister" value={member.confirmationMinisterName} />
        </InfoSection>

        <InfoSection title="Contact & Address">
          <InfoField label="Cell Phone" value={member.cellPhoneNumber} />
          <InfoField label="House Phone" value={member.housePhoneNumber} />
          <InfoField label="Email" value={member.email} />
          <InfoField label="Residence Area" value={member.residenceArea} />
          <div className="col-span-2">
            <InfoField label="Residence Address" value={member.address} />
          </div>
          <InfoField label="GPS Address" value={member.gpsAddress} />
          <InfoField label="Postal Address" value={member.postalAddress} />
        </InfoSection>

        {member.children && member.children.length > 0 && (
          <InfoSection title={`Children Details (${member.children.length})`}>
            {member.children.map((child, idx) => (
              <React.Fragment key={idx}>
                <div className="col-span-2">
                  <InfoField label={`Child ${idx + 1} Name`} value={child.name} />
                </div>
                <InfoField label="DOB" value={child.dateOfBirth} />
                <InfoField label="Place of Birth" value={child.placeOfBirth} />
              </React.Fragment>
            ))}
          </InfoSection>
        )}
      </div>

      {/* Footer / Signatures */}
      <div className="mt-6 pt-3 border-t border-gray-100 flex justify-between items-end">
        <div className="text-[8px] text-gray-400 italic max-w-[300px]">
          This document is an official membership record of the Global Evangelical Church, Ashaley Botwe/Ogbojo. Information provided is confidential.
        </div>
        <div className="flex gap-6">
          <div className="text-center">
            <div className="w-24 border-b border-gray-300 mb-1"></div>
            <p className="text-[7px] font-bold text-gray-500 uppercase">Member's Signature</p>
          </div>
          <div className="text-center">
            <div className="w-24 border-b border-gray-300 mb-1"></div>
            <p className="text-[7px] font-bold text-gray-500 uppercase">Pastor's Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
};
