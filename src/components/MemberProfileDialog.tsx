import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Member, Household } from "../types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Users, 
  GraduationCap, 
  Church, 
  Phone, 
  MapPin, 
  Mail,
  Heart,
  Briefcase,
  CheckCircle2,
  ShieldCheck,
  Home,
  ExternalLink
} from "lucide-react";

interface MemberProfileDialogProps {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
  households: Household[];
}

export function MemberProfileDialog({ member, isOpen, onClose, households }: MemberProfileDialogProps) {
  if (!member) return null;

  const householdName = households.find(h => h.householdId === member.householdId)?.householdName || "None";

  const InfoRow = ({ label, value }: { label: string; value: string | boolean | number | undefined }) => (
    <div className="flex flex-col space-y-1">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className="text-sm font-semibold">{value === true ? "Yes" : value === false ? "No" : value || "N/A"}</span>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg shrink-0">
              <AvatarImage src={member.photo} alt={member.firstName} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {member.firstName[0]}{member.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-2xl font-bold truncate">
                  {member.title} {member.firstName} {member.lastName}
                </DialogTitle>
                <Badge 
                  variant={member.membershipStatus === "Active" ? "default" : "secondary"}
                  className={member.membershipStatus === "Active" ? "bg-green-100 text-green-800 hover:bg-green-100 border-none" : ""}
                >
                  {member.membershipStatus}
                </Badge>
              </div>
              <DialogDescription className="text-base font-medium text-muted-foreground">
                {member.id} • {member.department || "No Department"}
              </DialogDescription>
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" /> {member.cellPhoneNumber || member.phone}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" /> {member.email || "No email"}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {member.residenceArea || "No area"}
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="personal" className="flex-1 flex flex-col mt-6 overflow-hidden">
          <div className="px-6 border-b">
            <ScrollArea className="w-full">
              <TabsList className="inline-flex w-max justify-start bg-transparent h-auto p-0 gap-6">
                <TabsTrigger value="personal" className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-2 border-transparent rounded-none px-0 py-2 text-xs font-bold uppercase tracking-wider">Personal</TabsTrigger>
                <TabsTrigger value="family" className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-2 border-transparent rounded-none px-0 py-2 text-xs font-bold uppercase tracking-wider">Family</TabsTrigger>
                <TabsTrigger value="parents" className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-2 border-transparent rounded-none px-0 py-2 text-xs font-bold uppercase tracking-wider">Parents</TabsTrigger>
                <TabsTrigger value="professional" className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-2 border-transparent rounded-none px-0 py-2 text-xs font-bold uppercase tracking-wider">Professional</TabsTrigger>
                <TabsTrigger value="membership" className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-2 border-transparent rounded-none px-0 py-2 text-xs font-bold uppercase tracking-wider">Membership</TabsTrigger>
                <TabsTrigger value="contact" className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-2 border-transparent rounded-none px-0 py-2 text-xs font-bold uppercase tracking-wider">Contact</TabsTrigger>
                <TabsTrigger value="admin" className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-2 border-transparent rounded-none px-0 py-2 text-xs font-bold uppercase tracking-wider">Admin</TabsTrigger>
              </TabsList>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6">
              <TabsContent value="personal" className="mt-0 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <InfoRow label="Title" value={member.title} />
                  <InfoRow label="Surname" value={member.lastName} />
                  <InfoRow label="Other Names" value={member.firstName} />
                  <InfoRow label="Gender" value={member.gender} />
                  <InfoRow label="Date of Birth" value={member.dateOfBirth} />
                  <InfoRow label="Place of Birth" value={member.placeOfBirth} />
                  <InfoRow label="Day Born" value={member.dayBorn} />
                  <InfoRow label="Hometown" value={member.homeTown} />
                  <InfoRow label="Region" value={member.region} />
                  <InfoRow label="Country" value={member.country} />
                  <InfoRow label="Languages" value={member.languagesSpoken} />
                </div>
              </TabsContent>

              <TabsContent value="family" className="mt-0 space-y-8">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold flex items-center gap-2 text-primary">
                    <Heart className="h-4 w-4" /> Marital Status
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <InfoRow label="Status" value={member.maritalStatus} />
                    <InfoRow label="Type of Marriage" value={member.typeOfMarriage} />
                    <InfoRow label="Date of Marriage" value={member.dateOfMarriage} />
                    <InfoRow label="Place of Marriage" value={member.placeOfMarriage} />
                    <InfoRow label="Spouse Name" value={member.spouseName} />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-sm font-bold flex items-center gap-2 text-primary">
                    <Users className="h-4 w-4" /> Children ({member.children?.length || 0})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {member.children?.map((child, i) => (
                      <div key={i} className="p-3 rounded-md border text-sm bg-muted/5">
                        <div className="font-bold">{child.name}</div>
                        <div className="text-xs text-muted-foreground">DOB: {child.dateOfBirth} • POB: {child.placeOfBirth}</div>
                      </div>
                    ))}
                    {(!member.children || member.children.length === 0) && (
                      <p className="text-sm text-muted-foreground italic">No children recorded.</p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-sm font-bold flex items-center gap-2 text-primary">
                    <User className="h-4 w-4" /> Next of Kin & Family Contact
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <InfoRow label="Next of Kin" value={member.nextOfKin} />
                    <InfoRow label="N.O.K Phone" value={member.nextOfKinPhone} />
                    <InfoRow label="Family Contact" value={member.contactPersonFamilyName} />
                    <InfoRow label="Contact Tel" value={member.contactPersonFamilyTel} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="parents" className="mt-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4 p-4 rounded-lg border bg-muted/10">
                    <p className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                      <User className="h-3 w-3" /> Father
                    </p>
                    <div className="grid grid-cols-1 gap-4">
                      <InfoRow label="Name" value={member.father?.name} />
                      <div className="grid grid-cols-2 gap-4">
                        <InfoRow label="Alive" value={member.father?.isAlive} />
                        <InfoRow label="Phone" value={member.father?.phone} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 p-4 rounded-lg border bg-muted/10">
                    <p className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                      <User className="h-3 w-3" /> Mother
                    </p>
                    <div className="grid grid-cols-1 gap-4">
                      <InfoRow label="Name" value={member.mother?.name} />
                      <div className="grid grid-cols-2 gap-4">
                        <InfoRow label="Alive" value={member.mother?.isAlive} />
                        <InfoRow label="Phone" value={member.mother?.phone} />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="professional" className="mt-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4 p-4 rounded-lg border bg-muted/10">
                    <h4 className="text-sm font-bold flex items-center gap-2 text-primary">
                      <GraduationCap className="h-4 w-4" /> Education
                    </h4>
                    <InfoRow label="Level of Education" value={member.educationLevel} />
                  </div>
                  <div className="space-y-4 p-4 rounded-lg border bg-muted/10">
                    <h4 className="text-sm font-bold flex items-center gap-2 text-primary">
                      <Briefcase className="h-4 w-4" /> Profession
                    </h4>
                    <InfoRow label="Occupation/Profession" value={member.occupationProfession} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="membership" className="mt-0 space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <InfoRow label="Membership Date" value={member.membershipDate} />
                  <InfoRow label="General Group" value={member.generalGroup} />
                  <InfoRow label="Position" value={member.position} />
                  <InfoRow label="Effective Date" value={member.effectiveDate} />
                  <InfoRow label="Rel. Denomination" value={member.relDenomination} />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4 p-4 rounded-lg border bg-muted/10">
                    <h4 className="text-sm font-bold flex items-center gap-2 text-primary">
                      <Church className="h-4 w-4" /> Baptism
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <InfoRow label="Baptized" value={member.isBaptized} />
                      <InfoRow label="Date" value={member.baptismDate} />
                      <InfoRow label="Place" value={member.baptismPlace} />
                      <InfoRow label="Minister" value={member.baptismMinisterName} />
                    </div>
                  </div>
                  <div className="space-y-4 p-4 rounded-lg border bg-muted/10">
                    <h4 className="text-sm font-bold flex items-center gap-2 text-primary">
                      <CheckCircle2 className="h-4 w-4" /> Confirmation
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <InfoRow label="Communicant" value={member.isCommunicant} />
                      <InfoRow label="Date" value={member.confirmationDate} />
                      <InfoRow label="Place" value={member.confirmationPlace} />
                      <InfoRow label="Minister" value={member.confirmationMinisterName} />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="contact" className="mt-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4 p-4 rounded-lg border bg-muted/10">
                    <h4 className="text-sm font-bold flex items-center gap-2 text-primary">
                      <Phone className="h-4 w-4" /> Phone Numbers
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <InfoRow label="Cell Phone" value={member.cellPhoneNumber} />
                      <InfoRow label="House Phone" value={member.housePhoneNumber} />
                    </div>
                  </div>
                  <div className="space-y-4 p-4 rounded-lg border bg-muted/10">
                    <h4 className="text-sm font-bold flex items-center gap-2 text-primary">
                      <Mail className="h-4 w-4" /> Online
                    </h4>
                    <InfoRow label="Email Address" value={member.email} />
                  </div>
                </div>
                <div className="space-y-4 p-4 rounded-lg border bg-muted/10">
                  <h4 className="text-sm font-bold flex items-center gap-2 text-primary">
                    <MapPin className="h-4 w-4" /> Address
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InfoRow label="Residence Area" value={member.residenceArea} />
                    <InfoRow label="Residence Address" value={member.address} />
                    <InfoRow label="Postal Address" value={member.postalAddress} />
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">GPS Address</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{member.gpsAddress || "N/A"}</span>
                        {member.gpsAddress && (
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(member.gpsAddress)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80 transition-colors"
                            title="Open in Google Maps"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="admin" className="mt-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4 p-4 rounded-lg border bg-muted/10">
                    <h4 className="text-sm font-bold flex items-center gap-2 text-primary">
                      <ShieldCheck className="h-4 w-4" /> Membership Info
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <InfoRow label="Status" value={member.membershipStatus} />
                      <InfoRow label="Department" value={member.department} />
                      <InfoRow label="Team" value={member.groupMinistry} />
                    </div>
                  </div>
                  <div className="space-y-4 p-4 rounded-lg border bg-muted/10">
                    <h4 className="text-sm font-bold flex items-center gap-2 text-primary">
                      <Home className="h-4 w-4" /> Household Info
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <InfoRow label="Household" value={householdName} />
                      <InfoRow label="Role" value={member.role} />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
