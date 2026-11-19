const fs = require("fs");
const path = require("path");

const complaintsData = `complaint_id,ack_no_1930,timestamp,district,state,fraud_type,transaction_amount,transaction_channel,latitude,longitude,status,risk_level,victim_id_hash,destination_mule_account,golden_hour_mins_remaining
CMP-10482,21909260010482,2026-09-23T22:14:00+05:30,Cyberabad,Telangana,UPI Impersonation / Fake QR,18400,UPI,17.412,78.452,LIEN_PLACED,CRITICAL,7f2a89c41d,MULE-SBI-4891,18
CMP-10481,21909260010481,2026-09-23T21:58:00+05:30,Cyberabad,Telangana,Digital Arrest (CBI/ED),320000,Netbanking,17.398,78.486,IN_REVIEW,CRITICAL,c19d45e02b,MULE-HDFC-9102,34
CMP-10480,21909260010480,2026-09-23T21:31:00+05:30,Hyderabad Central,Telangana,Wallet Takeover,7600,Wallet,17.445,78.438,OPEN,HIGH,54b17a33ef,MULE-PAYTM-3120,61
CMP-10479,21909260010479,2026-09-23T20:46:00+05:30,Cyberabad,Telangana,QR Code Merchant Scam,12500,UPI,17.412,78.452,LIEN_PLACED,CRITICAL,9a310c87ee,MULE-SBI-4891,12
CMP-10478,21909260010478,2026-09-23T20:10:00+05:30,Rachakonda,Telangana,Part-Time Job Scam,4100,UPI,17.352,78.438,RECOVERED,MEDIUM,1d082fa180,MULE-AIRTEL-7741,0
CMP-10477,21909260010477,2026-09-23T19:42:00+05:30,Cyberabad,Telangana,Remote Access APK (AnyDesk),26700,Netbanking,17.398,78.486,IN_REVIEW,HIGH,b82c903da5,MULE-HDFC-9102,89
CMP-10476,21909260010476,2026-09-23T19:15:00+05:30,Hyderabad Central,Telangana,Task-based Telegram Fraud,85000,IMPS,17.445,78.438,OPEN,CRITICAL,44fa1289de,MULE-CANARA-5521,42
CMP-10475,21909260010475,2026-09-23T18:40:00+05:30,Cyberabad,Telangana,Illegal Loan App Extortion,15000,UPI,17.425,78.392,IN_REVIEW,MEDIUM,82bc9941ea,MULE-ICICI-6619,105
CMP-10474,21909260010474,2026-09-23T18:05:00+05:30,Bengaluru South,Karnataka,AEPS Biometric Clone,48000,AEPS,12.924,77.583,LIEN_PLACED,HIGH,91cd40a92b,MULE-SBI-4891,28
CMP-10473,21909260010473,2026-09-23T17:30:00+05:30,Cyberabad,Telangana,Electricity Bill Threat SMS,21000,UPI,17.412,78.452,OPEN,HIGH,77d4021fa4,MULE-SBI-4891,55
CMP-10472,21909260010472,2026-09-23T16:50:00+05:30,Pune East,Maharashtra,Customs / FedEx Drug Parcel,150000,NEFT,18.520,73.856,IN_REVIEW,CRITICAL,33fa8710be,MULE-AXIS-8832,15
CMP-10471,21909260010471,2026-09-23T16:10:00+05:30,Cyberabad,Telangana,SIM Swap / OTP Intercept,95000,IMPS,17.398,78.486,LIEN_PLACED,CRITICAL,65ee1902da,MULE-HDFC-9102,8
CMP-10470,21909260010470,2026-09-23T15:25:00+05:30,Hyderabad Central,Telangana,Sextortion Video Blackmail,35000,UPI,17.445,78.438,OPEN,HIGH,119de048ba,MULE-PAYTM-3120,74
CMP-10469,21909260010469,2026-09-23T14:40:00+05:30,New Delhi Southwest,Delhi,Work From Home YouTube Like,64000,UPI,28.584,77.089,CLOSED,MEDIUM,55bc8120fa,MULE-AIRTEL-7741,0
CMP-10468,21909260010468,2026-09-23T13:50:00+05:30,Cyberabad,Telangana,Stock Market IPO Fraud,420000,NEFT,17.412,78.452,LIEN_PLACED,CRITICAL,88cd2231ab,MULE-CANARA-5521,5
CMP-10467,21909260010467,2026-09-23T12:30:00+05:30,Cyberabad,Telangana,Fake Credit Card Reward Points,19800,UPI,17.425,78.392,RECOVERED,LOW,29ae7719cc,MULE-ICICI-6619,0
CMP-10466,21909260010466,2026-09-23T11:15:00+05:30,Rachakonda,Telangana,OLX Defence Officer Scam,28500,QR,17.352,78.438,OPEN,MEDIUM,71aa9042bd,MULE-PAYTM-3120,118
CMP-10465,21909260010465,2026-09-23T10:05:00+05:30,Cyberabad,Telangana,Matrimonial Honeytrap Scam,110000,IMPS,17.398,78.486,IN_REVIEW,HIGH,43de8890cb,MULE-AXIS-8832,48
CMP-10464,21909260010464,2026-09-23T09:20:00+05:30,Hyderabad Central,Telangana,PAN Card KYC Update APK,52000,Netbanking,17.445,78.438,LIEN_PLACED,CRITICAL,19df3322aa,MULE-SBI-4891,22
CMP-10463,21909260010463,2026-09-23T08:15:00+05:30,Cyberabad,Telangana,Aadhaar Gaming Tournament Fraud,9200,UPI,17.352,78.438,CLOSED,LOW,84fa0011de,MULE-AIRTEL-7741,0`;

const riskZonesData = `zone_id,zone_name,district,latitude,longitude,atm_density,historical_fraud_density,complaint_density,risk_score,model_confidence,prediction_window,nearest_pcr_unit,jurisdiction_police_stn,data_label
H03,Central Transit Grid,Cyberabad,17.412,78.452,Critical,High,18,92,89,Next 2 hours,PCR-Delta-04,Begumpet Cyber PS,SYNTHETIC DEMO
H07,East Market Cluster,Cyberabad,17.398,78.486,High,High,14,84,85,Next 4 hours,PCR-Echo-09,Secunderabad Cyber PS,SYNTHETIC DEMO
H02,North Residential Grid,Hyderabad Central,17.445,78.438,High,Medium,11,68,76,Next 6 hours,PCR-Bravo-02,Panjagutta PS,SYNTHETIC DEMO
H04,Cyber Tech Corridor,Cyberabad,17.440,78.380,High,High,9,64,80,Next 8 hours,PCR-Alpha-07,Madhapur Cyber PS,SYNTHETIC DEMO
H09,Airport Expressway,Rachakonda,17.352,78.438,Medium,Medium,5,42,68,Next 12 hours,PCR-Golf-03,Shamshabad Cyber PS,SYNTHETIC DEMO
H05,West Industrial Zone,Cyberabad,17.425,78.392,Low,Low,3,25,58,Next 24 hours,PCR-Hotel-01,Sanathnagar PS,SYNTHETIC DEMO
H01,Old City Heritage Precinct,Hyderabad Central,17.361,78.474,Medium,Medium,7,51,72,Next 12 hours,PCR-Charlie-05,Charminar PS,SYNTHETIC DEMO
H06,Financial District Hub,Cyberabad,17.418,78.348,Medium,High,8,59,79,Next 8 hours,PCR-Tango-08,Gachibowli PS,SYNTHETIC DEMO`;

const muleAccountsData = `mule_account_id,bank_name,ifsc_prefix,account_holder_alias,layer_depth,inflow_amount,outflow_amount,current_balance,lien_status,first_flagged_time,linked_complaints_count,risk_score,predicted_cashout_atm_zone
MULE-SBI-4891,State Bank of India,SBIN0004891,R. Kumar (Mule Layer 1),Layer 1 (Direct Inflow),482000,394000,88000,FROZEN_CFCFRMS,2026-09-23T14:10:00+05:30,8,94,H03
MULE-HDFC-9102,HDFC Bank,HDFC0009102,V. Sharma (Aggregator Layer 2),Layer 2 (Layering Hub),860000,740000,120000,ACTIVE_HIGH_RISK,2026-09-23T15:20:00+05:30,6,89,H07
MULE-PAYTM-3120,Paytm Payments Bank,PYTM0123456,S. Verma (Micro-Splitter),Layer 1 (Direct Inflow),145000,118000,27000,PENDING_LIEN,2026-09-23T16:05:00+05:30,4,72,H02
MULE-CANARA-5521,Canara Bank,CNRB0005521,Deepak M. (Bulk Courier),Layer 2 (Layering Hub),590000,530000,60000,ACTIVE_HIGH_RISK,2026-09-23T16:45:00+05:30,5,86,H03
MULE-AXIS-8832,Axis Bank,UTIB0008832,Anil G. (Cashout Runner L3),Layer 3 (Terminal Cashout),380000,320000,60000,ACTIVE_HIGH_RISK,2026-09-23T17:15:00+05:30,4,81,H07
MULE-AIRTEL-7741,Airtel Payments Bank,AIRP0000001,P. Joshi (P2P Smurf),Layer 1 (Direct Inflow),82000,79000,3000,FROZEN_CFCFRMS,2026-09-23T18:00:00+05:30,3,65,H09
MULE-ICICI-6619,ICICI Bank,ICIC0006619,Mohd K. (Layer 3 Runner),Layer 3 (Terminal Cashout),290000,240000,50000,PENDING_LIEN,2026-09-23T18:40:00+05:30,2,58,H05`;

const atmClustersData = `cluster_id,zone_id,atm_name,bank_operator,latitude,longitude,hourly_withdrawal_velocity,predicted_window,surveillance_cctv,quick_reaction_team,jurisdiction_station
ATM-CL-01,H03,SBI E-Corner Transit Junction,State Bank of India,17.4124,78.4528,4.8x normal,22:00 - 00:30 hrs,Active (LEA Synced),PCR-Delta-04 (ETA: 3 min),Begumpet Cyber PS
ATM-CL-02,H03,HDFC 24x7 Express Kiosk,HDFC Bank,17.4131,78.4515,3.9x normal,22:30 - 01:00 hrs,Active (LEA Synced),PCR-Delta-04 (ETA: 4 min),Begumpet Cyber PS
ATM-CL-03,H07,Secunderabad Station ATM Cluster,Canara Bank,17.3985,78.4862,4.2x normal,21:45 - 00:00 hrs,Operational,PCR-Echo-09 (ETA: 5 min),Secunderabad Cyber PS
ATM-CL-04,H07,Market Road ICICI Terminal,ICICI Bank,17.3972,78.4871,3.4x normal,22:15 - 00:45 hrs,Operational,PCR-Echo-09 (ETA: 6 min),Secunderabad Cyber PS
ATM-CL-05,H02,Panjagutta Circle Axis ATM,Axis Bank,17.4452,78.4385,2.7x normal,23:00 - 02:00 hrs,Intermittent,PCR-Bravo-02 (ETA: 4 min),Panjagutta PS
ATM-CL-06,H04,Hitec City Cyber Towers ATM,SBI,17.4410,78.3812,2.3x normal,00:00 - 03:00 hrs,Active (LEA Synced),PCR-Alpha-07 (ETA: 5 min),Madhapur Cyber PS
ATM-CL-07,H09,Airport Toll Plaza Canara Kiosk,Canara Bank,17.3524,78.4389,1.9x normal,01:00 - 04:00 hrs,Active (LEA Synced),PCR-Golf-03 (ETA: 8 min),Shamshabad Cyber PS
ATM-CL-08,H06,Financial District ICICI Hub,ICICI Bank,17.4185,78.3490,2.1x normal,23:30 - 02:30 hrs,Active (LEA Synced),PCR-Tango-08 (ETA: 6 min),Gachibowli PS`;

fs.writeFileSync(path.join("data", "complaints.csv"), complaintsData.trim(), "utf8");
fs.writeFileSync(path.join("data", "risk_zones.csv"), riskZonesData.trim(), "utf8");
fs.writeFileSync(path.join("data", "mule_accounts.csv"), muleAccountsData.trim(), "utf8");
fs.writeFileSync(path.join("data", "atm_clusters.csv"), atmClustersData.trim(), "utf8");
console.log("All 4 synthetic datasets created successfully!");
