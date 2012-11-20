require 'dicom'
a = DICOM::Anonymizer.new
input_path = "./incoming/" + ARGV[0]
output_path = "./afteranonymization/" + ARGV[0]
input_id = ARGV[0]
Dir.mkdir input_path
Dir.mkdir output_path
`unzip #{input_id} -d #{input_path}`
a.add_folder(input_path)
a.write_path = output_path
a.delete_private = true
# General
a.set_tag("0002,0012", :value => "") # Implementation Class UID
a.set_tag("0002,0013", :value => "") # Implementation Class UID
a.set_tag("0002,0016", :value => "") # Source Application Entity Title
a.set_tag("0002,0100", :value => "") # Private Information Creator UID
a.set_tag("0002,0102", :value => "") # Private Information
# UID Anonymity
a.set_tag("0002,0003", :value => "") # Media Storage SOP Instance UID
a.set_tag("0008,0018", :value => "") # SOP Instance UID
a.set_tag("0020,000D", :value => "") # Study Instance UID
a.set_tag("0020,000E", :value => "") # Series Instance UID
# Patient anonymization
a.set_tag("0010,0010", :value => "") # Patient's Name
a.set_tag("0010,0020", :value => "") # Patient ID
a.set_tag("0010,0021", :value => "") # Issuer of Patient ID
a.set_tag("0010,0022", :value => "") # Type of Patient ID
a.set_tag("0010,0030", :value => "") # Patient's Birth Date
a.set_tag("0010,0032", :value => "") # Patient's Birth Time
a.set_tag("0010,0050", :value => "") # Patient's Insurance Plan Code Sequence
a.set_tag("0010,0101", :value => "") # Patient's Primary Language Code Sequence
a.set_tag("0010,0102", :value => "") # Patient's Primary Language Code Modifier Sequence
a.set_tag("0010,1000", :value => "") # Other Patient IDs
a.set_tag("0010,1001", :value => "") # Other Patient Names
a.set_tag("0010,1002", :value => "") # Other Patient IDs Sequence
a.set_tag("0010,1005", :value => "") # Patient's Birth Name
a.set_tag("0010,1040", :value => "") # Patient's Address
a.set_tag("0010,1050", :value => "") # Insurance Plan Identification (RET)
a.set_tag("0010,1060", :value => "") # Patient's Mother's Birth Name
a.set_tag("0010,1080", :value => "") # Military Rank
a.set_tag("0010,1081", :value => "") # Branch of Service
a.set_tag("0010,1090", :value => "") # Medical Record Locator
a.set_tag("0010,2150", :value => "") # Country of Residence 
a.set_tag("0010,2152", :value => "") # Region of Residence  
a.set_tag("0010,2154", :value => "") # Patient's Telephone Numbers  
a.set_tag("0010,2160", :value => "") # Ethnic Group 
a.set_tag("0010,2180", :value => "") # Occupation 
a.set_tag("0010,21b0", :value => "") # Additional Patient History 
#a.set_tag("0010,21c0", :value => "") # Pregnancy Status 
a.set_tag("0010,21d0", :value => "") # Last Menstrual Date  
a.set_tag("0010,21f0", :value => "") # Patient's Religious Preference 
a.set_tag("0010,2202", :value => "") # Patient Species Code Sequence  
a.set_tag("0010,2203", :value => "") # Patient's Sex Neutered 
a.set_tag("0010,2293", :value => "") # Patient Breed Code Sequence  
a.set_tag("0010,2294", :value => "") # Breed Registration Sequence  
a.set_tag("0010,2295", :value => "") # Breed Registration Number  
a.set_tag("0010,2296", :value => "") # Breed Registry Code Sequence 
a.set_tag("0010,2297", :value => "") # Responsible Person 
a.set_tag("0010,2298", :value => "") # Responsible Person Role  
a.set_tag("0010,2299", :value => "") # Responsible Organization 
# Visit Anonymity
a.set_tag("0008,0080", :value => "") # Institution Name
a.set_tag("0008,0081", :value => "") # Institution Address
a.set_tag("0008,0082", :value => "") # Institution Code Sequence
a.set_tag("0008,0090", :value => "") # Referring Physician's Name
a.set_tag("0008,0092", :value => "") # Referring Physician's Address
a.set_tag("0008,0094", :value => "") # Referring Physician's Telephone Numbers
a.set_tag("0008,0096", :value => "") # Referring Physician Identification Sequence
a.set_tag("0008,0116", :value => "") # Responsible Organization
a.set_tag("0008,1048", :value => "") # Physician(s) of Record
a.set_tag("0008,1049", :value => "") # Physician(s) of Record Identification Sequence
a.set_tag("0008,1050", :value => "") # Performing Physician's Name
a.set_tag("0008,1052", :value => "") # Performing Physician Identification Sequence
a.set_tag("0008,1060", :value => "") # Name of Physician(s) Reading Study
a.set_tag("0008,1062", :value => "") # Physician(s) Reading Study Identification Sequence
a.set_tag("0008,1070", :value => "") # Operators' Name
a.set_tag("0008,1072", :value => "") # Operator Identification Sequence
a.set_tag("0038,0010", :value => "") # Admission ID
a.set_tag("0038,0011", :value => "") # Issuer of Admission ID
a.set_tag("0038,0016", :value => "") # Route of Admissions
a.set_tag("0038,001a", :value => "") # Scheduled Admission Date (RET)
a.set_tag("0038,001b", :value => "") # Scheduled Admission Time (RET)
a.set_tag("0038,001c", :value => "") # Scheduled Discharge Date (RET)
a.set_tag("0038,001d", :value => "") # Scheduled Discharge Time (RET)
a.set_tag("0038,001e", :value => "") # Scheduled Patient Institution Residence (RET)
a.set_tag("0038,0020", :value => "") # Admitting Date
a.set_tag("0038,0021", :value => "") # Admitting Time
a.set_tag("0038,0030", :value => "") # Discharge Date (RET)
a.set_tag("0038,0032", :value => "") # Discharge Time (RET)
a.set_tag("0038,0040", :value => "") # Discharge Diagnosis Description (RET) 
a.set_tag("0038,0044", :value => "") # Discharge Diagnosis Code Sequence (RET)
a.set_tag("0038,0300", :value => "") # Current Patient Location
a.set_tag("0038,0400", :value => "") # Patient's Institution Residence
a.set_tag("0038,0500", :value => "") # Patient State
# Study Anonymity
a.set_tag("0040,0253", :value => "") # Performed Procedure Step ID (local UAS)
a.set_tag("0040,0275", :value => "") # Request Attributes Sequence (local UAS)
a.set_tag("0020,0010", :value => "") # Study ID 
a.set_tag("0008,0050", :value => "") # Accession Number
a.set_tag("0032,000a", :value => "") # Study Status ID (RET)
a.set_tag("0032,000c", :value => "") # Study Priority ID (RET)
a.set_tag("0032,0012", :value => "") # Study ID Issuer (RET)
a.set_tag("0032,0032", :value => "") # Study Verified Date (RET)
a.set_tag("0032,0033", :value => "") # Study Verified Time (RET)
a.set_tag("0032,0034", :value => "") # Study Read Date (RET)
a.set_tag("0032,0035", :value => "") # Study Read Time (RET)
a.set_tag("0032,1000", :value => "") # Scheduled Study Start Date (RET)
a.set_tag("0032,1001", :value => "") # Scheduled Study Start Time (RET)
a.set_tag("0032,1010", :value => "") # Scheduled Study Stop Date (RET)
a.set_tag("0032,1011", :value => "") # Scheduled Study Stop Time (RET)
a.set_tag("0032,1020", :value => "") # Scheduled Study Location (RET)
a.set_tag("0032,1021", :value => "") # Scheduled Study Location AE Title (RET)
a.set_tag("0032,1030", :value => "") # Reason for Study (RET)
a.set_tag("0032,1031", :value => "") # Requesting Physician Identification Sequence
a.set_tag("0032,1032", :value => "") # Requesting Physician
a.set_tag("0032,1033", :value => "") # Requesting Service
a.set_tag("0032,1040", :value => "") # Study Arrival Date (RET)
a.set_tag("0032,1041", :value => "") # Study Arrival Time (RET)
a.set_tag("0032,1050", :value => "") # Study Completion Date (RET)
a.set_tag("0032,1051", :value => "") # Study Completion Time (RET)
a.set_tag("0032,1055", :value => "") # Study Component Status ID (RET)
a.set_tag("0032,1060", :value => "") # Requested Procedure Description
a.set_tag("0032,1064", :value => "") # Requested Procedure Code Sequence
a.set_tag("0032,1070", :value => "") # Requested Contrast Agent
a.set_tag("0032,4000", :value => "") # Study Comments
a.set_tag("0040,2008", :value => "") # Order Entered By
a.set_tag("0040,2009", :value => "") # Order Enterer's Location
a.set_tag("0040,2010", :value => "") # Order Callback Phone Number
# Procedure Anonymity
a.set_tag("0040,0001", :value => "") # Scheduled Station AE Title
a.set_tag("0040,0006", :value => "") # Scheduled Performing Physician's Name
a.set_tag("0040,000b", :value => "") # Scheduled Performing Physician Identification Sequence
a.set_tag("0040,0010", :value => "") # Scheduled Station Name
a.set_tag("0040,0011", :value => "") # Scheduled Procedure Step Location
a.set_tag("0040,0012", :value => "") # Pre-Medication
a.set_tag("0040,0241", :value => "") # Performed Station AE Title
a.set_tag("0040,0242", :value => "") # Performed Station Name
a.set_tag("0040,0243", :value => "") # Performed Location
a.set_tag("0040,0296", :value => "") # Billing Item Sequence
# Results Anonymity
a.set_tag("4008,0042", :value => "") # Results ID Issuer (RET)
# Interpretation Anonymity
a.set_tag("4008,010c", :value => "") # Interpretation Author (RET)
a.set_tag("4008,0114", :value => "") # Physician Approving Interpretation (RET)
a.set_tag("4008,0119", :value => "") # Distribution Name (RET)
a.set_tag("4008,011a", :value => "") # Distribution Address (RET)
a.set_tag("4008,0202", :value => "") # Interpretation ID Issuer (RET)
# Equipment Anonymity
a.set_tag("0008,0070", :value => "") # Manufacturer
a.set_tag("0008,1010", :value => "") # Station Name
a.set_tag("0008,1040", :value => "") # Institutional Department Name
a.set_tag("0008,1090", :value => "") # Manufacturer's Model Name
a.set_tag("0018,1000", :value => "") # Device Serial Number
a.set_tag("0018,1016", :value => "") # Secondary Capture Device Manufacturer
a.set_tag("0018,1017", :value => "") # Hardcopy Device Manufacturer
a.set_tag("0018,1018", :value => "") # Secondary Capture Device Manufacturer's Model Name
a.set_tag("0018,1019", :value => "") # Secondary Capture Device Software Version(s)
a.set_tag("0018,101a", :value => "") # Hardcopy Device Software Version
a.set_tag("0018,101b", :value => "") # Hardcopy Device Manufacturer's Model Name
a.set_tag("0018,1020", :value => "") # Software Version(s)
a.set_tag("0018,1200", :value => "") # Date of Last Calibration
a.set_tag("0018,1201", :value => "") # Time of Last Calibration
a.set_tag("0018,700c", :value => "") # Date of Last Detector Calibration
a.set_tag("0018,700e", :value => "") # Time of Last Detector Calibration
a.set_tag("0018,7010", :value => "") # Exposures on Detector Since Last Calibration
a.set_tag("0018,7011", :value => "") # Exposures on Detector Since Manufactured
# write to separate path, delete all private tags
a.print
a.execute
`zip -r #{input_id}a.osirixzip #{output_path}/*`
`rm -r #{input_path} #{output_path}`
`rm incoming/#{input_id}.zip`
puts "Anonymization done"
