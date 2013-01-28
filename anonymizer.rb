require 'rubygems'
require 'dicom'
a = DICOM::Anonymizer.new
input_path = "./incoming/" + ARGV[0]
output_path = "./afteranonymization/" + ARGV[0]
input_id = ARGV[0]
Dir.mkdir input_path
Dir.mkdir output_path
`unzip #{input_path}.zip -d #{input_path}`
a.add_folder(input_path)
a.write_path = output_path
a.delete_private = true
# General
#a.set_tag("0002,0012", :value => "") # Implementation Class UID
#a.set_tag("0002,0013", :value => "") # Implementation Class UID
#a.set_tag("0002,0016", :value => "") # Source Application Entity Title
#a.set_tag("0002,0100", :value => "") # Private Information Creator UID
#a.set_tag("0002,0102", :value => "") # Private Information
# UID Anonymity
#a.set_tag("0002,0003", :value => "") # Media Storage SOP Instance UID
#a.set_tag("0008,0018", :value => "") # SOP Instance UID
#a.set_tag("0020,000D", :value => "") # Study Instance UID
#a.set_tag("0020,000E", :value => "") # Series Instance UID
# Patient anonymization
#a.set_tag("0010,0010", :value => "") # Patient's Name
#a.set_tag("0010,0020", :value => "") # Patient ID
#a.set_tag("0010,0021", :value => "") # Issuer of Patient ID
#a.set_tag("0010,0022", :value => "") # Type of Patient ID
#a.set_tag("0010,0030", :value => "") # Patient's Birth Date
#a.set_tag("0010,0032", :value => "") # Patient's Birth Time
#a.set_tag("0010,0050", :value => "") # Patient's Insurance Plan Code Sequence
#a.set_tag("0010,0101", :value => "") # Patient's Primary Language Code Sequence
#a.set_tag("0010,0102", :value => "") # Patient's Primary Language Code Modifier Sequence
#a.set_tag("0010,1000", :value => "") # Other Patient IDs
#a.set_tag("0010,1001", :value => "") # Other Patient Names
#a.set_tag("0010,1002", :value => "") # Other Patient IDs Sequence
#a.set_tag("0010,1005", :value => "") # Patient's Birth Name
#a.set_tag("0010,1040", :value => "") # Patient's Address
#a.set_tag("0010,1050", :value => "") # Insurance Plan Identification (RET)
#a.set_tag("0010,1060", :value => "") # Patient's Mother's Birth Name
#a.set_tag("0010,1080", :value => "") # Military Rank
#a.set_tag("0010,1081", :value => "") # Branch of Service
#a.set_tag("0010,1090", :value => "") # Medical Record Locator
#a.set_tag("0010,2150", :value => "") # Country of Residence 
#a.set_tag("0010,2152", :value => "") # Region of Residence  
#a.set_tag("0010,2154", :value => "") # Patient's Telephone Numbers  
#a.set_tag("0010,2160", :value => "") # Ethnic Group 
#a.set_tag("0010,2180", :value => "") # Occupation 
#a.set_tag("0010,21b0", :value => "") # Additional Patient History 
#a.set_tag("0010,21c0", :value => "") # Pregnancy Status 
#a.set_tag("0010,21d0", :value => "") # Last Menstrual Date  
#a.set_tag("0010,21f0", :value => "") # Patient's Religious Preference 
#a.set_tag("0010,2202", :value => "") # Patient Species Code Sequence  
#a.set_tag("0010,2203", :value => "") # Patient's Sex Neutered 
#a.set_tag("0010,2293", :value => "") # Patient Breed Code Sequence  
#a.set_tag("0010,2294", :value => "") # Breed Registration Sequence  
#a.set_tag("0010,2295", :value => "") # Breed Registration Number  
#a.set_tag("0010,2296", :value => "") # Breed Registry Code Sequence 
#a.set_tag("0010,2297", :value => "") # Responsible Person 
#a.set_tag("0010,2298", :value => "") # Responsible Person Role  
#a.set_tag("0010,2299", :value => "") # Responsible Organization 
## Visit Anonymity
#a.set_tag("0008,0080", :value => "") # Institution Name
#a.set_tag("0008,0081", :value => "") # Institution Address
#a.set_tag("0008,0082", :value => "") # Institution Code Sequence
#a.set_tag("0008,0090", :value => "") # Referring Physician's Name
#a.set_tag("0008,0092", :value => "") # Referring Physician's Address
#a.set_tag("0008,0094", :value => "") # Referring Physician's Telephone Numbers
#a.set_tag("0008,0096", :value => "") # Referring Physician Identification Sequence
#a.set_tag("0008,0116", :value => "") # Responsible Organization
#a.set_tag("0008,1048", :value => "") # Physician(s) of Record
#a.set_tag("0008,1049", :value => "") # Physician(s) of Record Identification Sequence
#a.set_tag("0008,1050", :value => "") # Performing Physician's Name
#a.set_tag("0008,1052", :value => "") # Performing Physician Identification Sequence
#a.set_tag("0008,1060", :value => "") # Name of Physician(s) Reading Study
#a.set_tag("0008,1062", :value => "") # Physician(s) Reading Study Identification Sequence
#a.set_tag("0008,1070", :value => "") # Operators' Name
#a.set_tag("0008,1072", :value => "") # Operator Identification Sequence
#a.set_tag("0038,0010", :value => "") # Admission ID
#a.set_tag("0038,0011", :value => "") # Issuer of Admission ID
#a.set_tag("0038,0016", :value => "") # Route of Admissions
#a.set_tag("0038,001a", :value => "") # Scheduled Admission Date (RET)
#a.set_tag("0038,001b", :value => "") # Scheduled Admission Time (RET)
#a.set_tag("0038,001c", :value => "") # Scheduled Discharge Date (RET)
#a.set_tag("0038,001d", :value => "") # Scheduled Discharge Time (RET)
#a.set_tag("0038,001e", :value => "") # Scheduled Patient Institution Residence (RET)
#a.set_tag("0038,0020", :value => "") # Admitting Date
#a.set_tag("0038,0021", :value => "") # Admitting Time
#a.set_tag("0038,0030", :value => "") # Discharge Date (RET)
#a.set_tag("0038,0032", :value => "") # Discharge Time (RET)
#a.set_tag("0038,0040", :value => "") # Discharge Diagnosis Description (RET) 
#a.set_tag("0038,0044", :value => "") # Discharge Diagnosis Code Sequence (RET)
#a.set_tag("0038,0300", :value => "") # Current Patient Location
#a.set_tag("0038,0400", :value => "") # Patient's Institution Residence
#a.set_tag("0038,0500", :value => "") # Patient State
## Study Anonymity
#a.set_tag("0040,0253", :value => "") # Performed Procedure Step ID (local UAS)
#a.set_tag("0040,0275", :value => "") # Request Attributes Sequence (local UAS)
#a.set_tag("0020,0010", :value => "") # Study ID 
#a.set_tag("0008,0050", :value => "") # Accession Number
#a.set_tag("0032,000a", :value => "") # Study Status ID (RET)
#a.set_tag("0032,000c", :value => "") # Study Priority ID (RET)
#a.set_tag("0032,0012", :value => "") # Study ID Issuer (RET)
#a.set_tag("0032,0032", :value => "") # Study Verified Date (RET)
#a.set_tag("0032,0033", :value => "") # Study Verified Time (RET)
#a.set_tag("0032,0034", :value => "") # Study Read Date (RET)
#a.set_tag("0032,0035", :value => "") # Study Read Time (RET)
#a.set_tag("0032,1000", :value => "") # Scheduled Study Start Date (RET)
#a.set_tag("0032,1001", :value => "") # Scheduled Study Start Time (RET)
#a.set_tag("0032,1010", :value => "") # Scheduled Study Stop Date (RET)
#a.set_tag("0032,1011", :value => "") # Scheduled Study Stop Time (RET)
#a.set_tag("0032,1020", :value => "") # Scheduled Study Location (RET)
#a.set_tag("0032,1021", :value => "") # Scheduled Study Location AE Title (RET)
#a.set_tag("0032,1030", :value => "") # Reason for Study (RET)
#a.set_tag("0032,1031", :value => "") # Requesting Physician Identification Sequence
#a.set_tag("0032,1032", :value => "") # Requesting Physician
#a.set_tag("0032,1033", :value => "") # Requesting Service
#a.set_tag("0032,1040", :value => "") # Study Arrival Date (RET)
#a.set_tag("0032,1041", :value => "") # Study Arrival Time (RET)
#a.set_tag("0032,1050", :value => "") # Study Completion Date (RET)
#a.set_tag("0032,1051", :value => "") # Study Completion Time (RET)
#a.set_tag("0032,1055", :value => "") # Study Component Status ID (RET)
#a.set_tag("0032,1060", :value => "") # Requested Procedure Description
#a.set_tag("0032,1064", :value => "") # Requested Procedure Code Sequence
#a.set_tag("0032,1070", :value => "") # Requested Contrast Agent
#a.set_tag("0032,4000", :value => "") # Study Comments
#a.set_tag("0040,2008", :value => "") # Order Entered By
#a.set_tag("0040,2009", :value => "") # Order Enterer's Location
#a.set_tag("0040,2010", :value => "") # Order Callback Phone Number
## Procedure Anonymity
#a.set_tag("0040,0001", :value => "") # Scheduled Station AE Title
#a.set_tag("0040,0006", :value => "") # Scheduled Performing Physician's Name
#a.set_tag("0040,000b", :value => "") # Scheduled Performing Physician Identification Sequence
#a.set_tag("0040,0010", :value => "") # Scheduled Station Name
#a.set_tag("0040,0011", :value => "") # Scheduled Procedure Step Location
#a.set_tag("0040,0012", :value => "") # Pre-Medication
#a.set_tag("0040,0241", :value => "") # Performed Station AE Title
#a.set_tag("0040,0242", :value => "") # Performed Station Name
#a.set_tag("0040,0243", :value => "") # Performed Location
#a.set_tag("0040,0296", :value => "") # Billing Item Sequence
## Results Anonymity
#a.set_tag("4008,0042", :value => "") # Results ID Issuer (RET)
## Interpretation Anonymity
#a.set_tag("4008,010c", :value => "") # Interpretation Author (RET)
#a.set_tag("4008,0114", :value => "") # Physician Approving Interpretation (RET)
#a.set_tag("4008,0119", :value => "") # Distribution Name (RET)
#a.set_tag("4008,011a", :value => "") # Distribution Address (RET)
#a.set_tag("4008,0202", :value => "") # Interpretation ID Issuer (RET)
## Equipment Anonymity
#a.set_tag("0008,0070", :value => "") # Manufacturer
#a.set_tag("0008,1010", :value => "") # Station Name
#a.set_tag("0008,1040", :value => "") # Institutional Department Name
#a.set_tag("0008,1090", :value => "") # Manufacturer's Model Name
#a.set_tag("0018,1000", :value => "") # Device Serial Number
#a.set_tag("0018,1016", :value => "") # Secondary Capture Device Manufacturer
#a.set_tag("0018,1017", :value => "") # Hardcopy Device Manufacturer
#a.set_tag("0018,1018", :value => "") # Secondary Capture Device Manufacturer's Model Name
#a.set_tag("0018,1019", :value => "") # Secondary Capture Device Software Version(s)
#a.set_tag("0018,101a", :value => "") # Hardcopy Device Software Version
#a.set_tag("0018,101b", :value => "") # Hardcopy Device Manufacturer's Model Name
#a.set_tag("0018,1020", :value => "") # Software Version(s)
#a.set_tag("0018,1200", :value => "") # Date of Last Calibration
#a.set_tag("0018,1201", :value => "") # Time of Last Calibration
#a.delete_tag("0018,4000")            # Aquisition Comments
#a.set_tag("0018,700c", :value => "") # Date of Last Detector Calibration
#a.set_tag("0018,700e", :value => "") # Time of Last Detector Calibration
#a.set_tag("0018,7010", :value => "") # Exposures on Detector Since Last Calibration
#a.set_tag("0018,7011", :value => "") # Exposures on Detector Since Manufactured
#a.set_tag("0032,1064", :value => "") # RequestedProcedureCodeSequence
## ==========================================
## from DICOM Clinial Trial De-Indentification
# ftp://medical.nema.org/medical/dicom/final/sup142_ft.pdf
# ==========================================
a.delete_tag("0040,0555") # Acquisition Context Sequence
a.delete_tag("0008,0022") # Acquisition Date
a.delete_tag("0008,002A") # Acquisition Date Time
a.delete_tag("0018,1400") # Acquisition Device Processing Description
a.delete_tag("0018,9424") # Acquisition Protocol Description
a.delete_tag("0008,0032") # Acquisition Time
a.delete_tag("0040,4035") # Actual Human Performers Sequence
a.delete_tag("0010,2180") # Additional Patient's History
a.delete_tag("0038,0010") # Admission ID
a.delete_tag("0038,0020") # Admitting Date
a.delete_tag("0008,1084") # Admitting Diagnoses Code Sequence
a.delete_tag("0008,1080") # Admitting Diagnoses Description
a.delete_tag("0038,0021") # Admitting Time
a.delete_tag("0000,1000") # Affected SOP Instance UID
a.delete_tag("0010,2110") # Allergies
a.delete_tag("4000,0010") # Arbitrary
a.delete_tag("0040,A078") # Author Observer Sequence
a.delete_tag("0010,1081") # Branch of Service
a.delete_tag("0018,1007") # Cassette ID
a.delete_tag("0040,0280") # Comments on Performed Procedure Step
a.delete_tag("0040,3001") # Confidentiality Constraint on Patient Data Description
a.set_tag("0070,0084", :value => "0") # Content Creator's Name
a.delete_tag("0070,0086") # Content Creator's Identification Code Sequence
a.set_tag("0008,0023", :value => "0") # Content Date
a.delete_tag("0040,A730") # Content Sequence
a.set_tag("0008,0033", :value => "0") # Content Time
a.set_tag("0018,0010", :value => "0") # Contrast Bolus Agent
a.delete_tag("0018,A003") # Contribution Description
a.delete_tag("0010,2150") # Country of Residence
a.delete_tag("0038,0300") # Current Patient Location
#a.delete_tag("50xx,xxxx") # Curve Data
a.delete_tag("0008,0025") # Curve Date
a.delete_tag("0008,0035") # Curve Time
a.delete_tag("0040,A07C") # Custodial Organization Sequence
a.delete_tag("FFFC,FFFC") # Data Set Trailing Padding
a.delete_tag("0008,2111") # Derivation Description
a.delete_tag("0018,700A") # Detector ID
a.delete_tag("0018,1000") # Device Serial Number
a.delete_tag("0400,0100") # Digital Signature UID
a.delete_tag("FFFA,FFFA") # Digital Signatures Sequence
a.delete_tag("0038,0040") # Discharge Diagnosis Description
a.delete_tag("4008,011A") # Distribution Address
a.delete_tag("4008,0119") # Distribution Name
a.delete_tag("0010,2160") # Ethnic Group
a.set_tag("0040,2017", :value => "0") # Filler Order Number of Imaging Service Request
a.delete_tag("0020,9158") # Frame Comments
a.delete_tag("0018,1008") # Gantry ID
a.delete_tag("0018,1005") # Generator ID
a.set_tag("0070,0001", :value => "Dummy") # Graphic Annotation Sequence
a.delete_tag("0040,4037") # Human Performers Name
a.delete_tag("0040,4036") # Human Performers Organization
a.delete_tag("0088,0200") # Icon Image Sequence
a.delete_tag("0008,4000") # Identifying Comments
a.delete_tag("0020,4000") # Image Comments
a.delete_tag("0028,4000") # Image Presentation Comments
a.delete_tag("0040,2400") # Imaging Service Request Comments
a.delete_tag("4008,0300") # Impressions
a.delete_tag("0008,0081") # Institution Address
a.delete_tag("0008,0082") # Institution Code Sequence
a.delete_tag("0008,0080") # Institution Name
a.delete_tag("0008,1040") # Institutional Department Name
a.delete_tag("0010,1050") # Insurance Plan Identification
a.delete_tag("0040,1011") # Intended Recipients of Results Identification Sequence
a.delete_tag("4008,0111") # Interpretation Approver Sequence
a.delete_tag("4008,010C") # Interpretation Author
a.delete_tag("4008,0115") # Interpretation Diagnosis Description
a.delete_tag("4008,0202") # Interpretation ID Issuer
a.delete_tag("4008,010B") # Interpretation Text 
a.delete_tag("4008,010A") # Interpretation Transcriber
a.delete_tag("0038,0011") # Issuer of Admission ID
a.delete_tag("0010,0021") # Issuer of Patient ID 
a.delete_tag("0038,0061") # Issuer of Service Episode ID 
a.delete_tag("0010,21D0") # Last Menstrual Date
a.delete_tag("0400,0404") # MAC
a.delete_tag("0010,2000") # Medical Alerts
a.delete_tag("0010,1090") # Medical Record Locator
a.delete_tag("0010,1080") # Military Rank
a.delete_tag("0400,0550") # Modified Attributes Sequence
a.delete_tag("0020,3406") # Modified Image Description
a.delete_tag("0020,3401") # Modifying Device ID
a.delete_tag("0020,3404") # Modifying Device Manufacturer
a.delete_tag("0008,1060") # Name of Physician(s) Reading Study 
a.delete_tag("0040,1010") # Name of Intended Recipient of Results
a.delete_tag("0010,2180") # Occupation
a.delete_tag("0008,1072") # Operators' Identification Sequence
a.delete_tag("0008,1070") # Operators' Name 
a.delete_tag("0400,0561") # Original Attributes Sequence
a.delete_tag("0040,2010") # Order Callback Phone Number
a.delete_tag("0040,2008") # Order Entered By
a.delete_tag("0040,2009") # Order Enterer Location
a.delete_tag("0010,1000") # Other Patient IDs 
a.delete_tag("0010,1002") # Other Patient IDs Sequence
a.delete_tag("0010,1001") # Other Patient Names 
# http://storedicom.dyndns.org/DicomUtils/
(0..9).each do |p|
  (0..9).each do |q|
    a.delete_tag("60" + p.to_s + q.to_s + ",4000") # Overlay Comments
    a.delete_tag("60" + p.to_s + q.to_s + ",3000") # Overlay Data
  end
end
#a.delete_tag("60xx,4000") # Overlay Comments
#a.delete_tag("60xx,3000") # Overlay Data 
a.delete_tag("0008,0024") # Overlay Date 
a.delete_tag("0008,0034") # Overlay Time
a.delete_tag("0040,A07A") # Participant Sequence
a.delete_tag("0010,1040") # Patient Address
a.delete_tag("0010,4000") # Patient Comments
a.delete_tag("0010,0020") # Patient ID
a.delete_tag("0010,2203") # Patient Sex Neutered
a.delete_tag("0038,0500") # Patient State 
a.delete_tag("0040,1004") # Patient Transport Arrangements
a.delete_tag("0010,1010") # Patient's Age 
a.set_tag("0010,0030", :value => "0") # Patient's Birth Date 
a.delete_tag("0010,1005") # Patient's Birth Name 
a.delete_tag("0010,0032") # Patient's Birth Time 
a.delete_tag("0038,0400") # Patient's Institution Residence
a.delete_tag("0010,0050") # Patient's Insurance Plan Code Sequence
a.delete_tag("0010,1060") # Patient's Mother's Birth Name 
a.set_tag("0010,0010", :value => "0") # Patient's Name 
a.delete_tag("0010,0101") # Patient's Primary Language Code Sequence
a.delete_tag("0010,0102") # Patient's Primary Language Modifier Code Sequence
a.delete_tag("0010,21F0") # Patient's Religious Preference
a.set_tag("0010,0040", :value => "0") # Patient's Sex 
a.delete_tag("0010,1020") # Patient's Size
a.delete_tag("0010,2154") # Patient's Telephone Number 
a.delete_tag("0010,1030") # Patient's Weight
a.delete_tag("0040,0243") # Performed Location 
a.delete_tag("0040,0254") # Performed Procedure Step Description
a.delete_tag("0040,0253") # Performed Procedure Step ID 
a.delete_tag("0040,0244") # Performed Procedure Step Start Date 
a.delete_tag("0040,0245") # Performed Procedure Step Start Time
a.delete_tag("0040,0241") # Performed Station AE Title
a.delete_tag("0040,4030") # Performed Station Geographic Location Code Sequence
a.delete_tag("0040,0242") # Performed Station Name
a.delete_tag("0040,0248") # Performed Station Name Code Sequence
a.delete_tag("0008,1052") # Performing Physician's Identification Sequence
a.delete_tag("0008,1050") # Performing Physician's Name
a.delete_tag("0040,1102") # Person Address
a.set_tag("0040,1101", :value => "dummy") # Person Identification Code Sequence 
a.set_tag("0040,A123", :value => "dummy") # Person Name
a.delete_tag("0040,1103") # Person Telephone Number
a.delete_tag("4008,0114") # Physician Approving Interpretation
a.delete_tag("0008,1062") # Physician Reading Study Identification Sequence
a.delete_tag("0008,1048") # Physician(s) of Record
a.delete_tag("0008,1049") # Physician(s) of Record Identification Sequence
a.set_tag("0040,2016", :value => "0") # Placer Order Number of Imaging Service Request
a.delete_tag("0018,1004") # Plate ID
a.delete_tag("0040,0012") # Pre-Medication
a.delete_tag("0010,21C0") # Pregnancy Status
a.delete_tag("0018,1030") # Protocol Name 
a.delete_tag("0040,2001") # Reason for Imaging Service Request
a.delete_tag("0032,1030") # Reason for Study 
a.delete_tag("0400,0402") # Referenced Digital Signature Sequence
a.delete_tag("0008,1140") # Referenced Image Sequence
a.delete_tag("0038,1234") # Referenced Patient Alias Sequence
a.delete_tag("0008,1120") # Referenced Patient Sequence 
a.delete_tag("0008,1111") # Referenced Performed Procedure Sequence
a.delete_tag("0400,0403") # Referenced SOP Instance MAC Sequence
a.delete_tag("0008,1110") # Referenced Study Sequence 
a.delete_tag("0008,0092") # Referring Physician's Address
a.delete_tag("0008,0096") # Referring Physician's Identification Sequence
a.set_tag("0008,0090", :value => "0") # Referring Physician's Name
a.delete_tag("0008,0094") # Referring Physician's Telephone Numbers
a.delete_tag("0010,2152") # Region of Residence
a.delete_tag("0040,0275") # Request Attributes Sequence
a.delete_tag("0032,1070") # Requested Contrast Agent
a.delete_tag("0040,1400") # Requested Procedure Comments
a.delete_tag("0032,1060") # Requested Procedure Description
a.delete_tag("0040,1001") # Requested Procedure ID 
a.delete_tag("0040,1005") # Requested Procedure Location 
a.delete_tag("0032,1032") # Requesting Physician
a.delete_tag("0032,1033") # Requesting Service
a.delete_tag("0010,2299") # Responsible Organization
a.delete_tag("0010,2297") # Responsible Person
a.delete_tag("4008,4000") # Results Comments
a.delete_tag("4008,0118") # Results Distribution List Sequence
a.delete_tag("4008,0042") # Results ID Issuer
a.delete_tag("300E,0008") # Reviewer Name
a.delete_tag("0040,4034") # Scheduled Human Performers Sequence
a.delete_tag("0038,001E") # Scheduled Patient Institution Residence
a.delete_tag("0040,000B") # Scheduled Performing Physician Identification Sequence
a.delete_tag("0040,0006") # Scheduled Performing Physician Name 
a.delete_tag("0040,0004") # Scheduled Procedure Step End Date 
a.delete_tag("0040,0005") # Scheduled Procedure Step End Time 
a.delete_tag("0040,0007") # Scheduled Procedure Step Description
a.delete_tag("0040,0011") # Scheduled Procedure Step Location 
a.delete_tag("0040,0002") # Scheduled Procedure Step Start Date 
a.delete_tag("0040,0003") # Scheduled Procedure Step Start Time
a.delete_tag("0040,0001") # Scheduled Station AE Title 
a.delete_tag("0040,4027") # Scheduled Station Geographic Location Code Sequence
a.delete_tag("0040,0010") # Scheduled Station Name 
a.delete_tag("0040,4025") # Scheduled Station Name Code Sequence
a.delete_tag("0032,1020") # Scheduled Study Location 
a.delete_tag("0032,1021") # Scheduled Study Location AE Title 
a.delete_tag("0008,0021") # Series Date 
a.delete_tag("0008,103E") # Series Description
a.delete_tag("0008,0031") # Series Time 
a.delete_tag("0038,0062") # Service Episode Description
a.delete_tag("0038,0060") # Service Episode ID 
a.delete_tag("0010,21A0") # Smoking Status
a.delete_tag("0008,2112") # Source Image Sequence
a.delete_tag("0038,0050") # Special Needs
a.delete_tag("0008,1010") # Station Name
a.delete_tag("0032,4000") # Study Comments
a.set_tag("0008,0020", :value => "0") # Study Date 
a.delete_tag("0008,1030") # Study Description
a.set_tag("0020,0010", :value => "0") # Study ID 
a.delete_tag("0032,0012") # Study ID Issuer
a.set_tag("0008,0030", :value => "0") # Study Time
a.delete_tag("4000,4000") # Text Comments 
a.delete_tag("2030,0020") # Text String 
a.delete_tag("0008,0201") # Timezone Offset from UTC
a.delete_tag("0088,0910") # Topic Author 
a.delete_tag("0088,0912") # Topic Key Words
a.delete_tag("0088,0906") # Topic Subject
a.delete_tag("0088,0904") # Topic Title
a.set_tag("0040,A088", :value => "0") # Verifying Observer Identification Code Sequence
a.set_tag("0040,A075", :value => "DummyValue") # Verifying Observer Name
a.set_tag("0040,A073", :value => "DummyValue") # Verifying Observer Sequence
a.delete_tag("0040,A027") # Verifying Organization
a.delete_tag("0038,4000") # Visit Comments

a.uid = true
a.uid_root = "1.2.826.0.1.3680043.9.2082"
a.uids = {"0020,9161"=>1,"0008,010D"=>2,"0008,9123"=>3,"0018,1002"=>4,"0020,9164"=>5,"300A,0013"=>6,"0008,0058"=>7,"0070,031A"=>8,"0020,0052"=>9,"0008,0014"=>10,"0008,3010"=>11,"0028,1214"=>12,"0002,0003"=>13,"0028,1199"=>14,"3006,0024"=>15,"0040,4023"=>16,"0008,1155"=>17,"0004,1511"=>18,"3006,00C2"=>19,"0000,1001"=>20,"0020,000E"=>21,"0008,0018"=>22,"0088,0140"=>23,"0020,000D"=>24,"0040,DB0D"=>25,"0040,DB0C"=>26,"0020,0200"=>27,"0008,1195"=>28,"0040,A124"=>29} 

# write to separate path, delete all private tags
#a.print
a.execute
`zip -r #{input_id}a.zip #{output_path}/*`
`rm -r #{input_path} #{output_path}`
`rm incoming/#{input_id}.zip`
`mv -f #{input_id}a.zip ./dicom/`
puts "Anonymization done"
