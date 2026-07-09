/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Beautifully redesigned with Premium Sage-Light Theme.
 * Interactive custom data visualizers, Customizable Attrition Heat Map,
 * Company Pulse metrics, and deep AI Attrition Diagnostics.
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import * as XLSX from "xlsx";
import { SettingsModal } from "./components/SettingsModal";
import { LandingPage } from "./components/LandingPage";
import {
  Users,
  TrendingUp,
  AlertTriangle,
  Search,
  Upload,
  Download,
  Copy,
  ChevronRight,
  Briefcase,
  MapPin,
  Clock,
  IndianRupee,
  Award,
  Sparkles,
  RefreshCw,
  FileText,
  Mail,
  Info,
  Sliders,
  Check,
  Compass,
  Home,
  Settings,
  LogOut,
  ArrowUpRight,
  ArrowDownRight,
  Heart,
  ChevronDown,
  X,
  Send,
  MessageSquare,
  Trash2,
  Share2
} from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { jsPDF } from "jspdf";
import { Employee, Locale } from "./types.ts";

const LOCALES: Record<string, Locale> = {
  en: {
    title: "Employee Retention",
    subtitle: "Employee Resignation Risk Predictor",
    uploadBtn: "Upload HR Data",
    dragDropText: "Drag & drop HR CSV/Excel file here or click to browse",
    atRiskCount: "At-Risk Employees",
    avgRisk: "Average Risk",
    filterAll: "All Employees",
    filterHigh: "High Risk (≥60%)",
    filterMed: "Medium Risk (30-59%)",
    filterLow: "Low Risk (<30%)",
    searchPlaceholder: "Search employee by name, department, or role...",
    colName: "Employee Info",
    colDept: "Department & Role",
    colRisk: "Turnover Risk",
    colScore: "Risk Score",
    riskLow: "Low Risk",
    riskMed: "Medium Risk",
    riskHigh: "High Risk",
    factorsTitle: "Top Risk Factors",
    assistantTitle: "AI Retention Assistant",
    generateBtn: "Generate Action Plan",
    talkingPointsTab: "Manager Talking Points",
    emailTab: "Email Draft",
    copiedMsg: "Copied!",
    noSelectionMsg: "Select an employee from the directory list to trigger AI diagnostics and personalized templates.",
    backToAllBtn: "Clear Selection",
    overtime: "Overtime",
    satisfaction: "Satisfaction",
    workLife: "Work Life",
    commute: "Commute",
    salary: "Income",
    reTrainSuccess: "Dataset retrained successfully! Model updated.",
    reTrainError: "Failed to train dataset. Please check the file headers.",
    unsupportedColumns: "Supported columns: age, monthly_income, years_at_company, years_since_last_promotion, distance_from_home_km, overtime, job_satisfaction, work_life_balance, environment_satisfaction, num_companies_worked, training_hours_last_year, attrition",
    downloadSample: "Download HR Template CSV",
    analyzingData: "Analyzing employee data...",
    creatingPlan: "Creating manager action plan...",
    draftingEmail: "Drafting email communication...",
    personnelCount: "Personnel Count",
    flightRisk: "organizational flight risk",
    aiEngineStatus: "AI Engine Status",
    copy: "Copy",
    regenerate: "Regenerate Template",
    disclaimer: "Confidential Disclaimer: This software uses AI to identify signs of employee stress and predict turnover risk. It provides indicators, not certainties. Always approach employee feedback and retention with empathy, understanding, and open communication.",
  },
  hi: {
    title: "कर्मचारी प्रतिधारण",
    subtitle: "कर्मचारी कारोबार का पूर्वानुमान",
    uploadBtn: "HR डेटा अपलोड करें",
    dragDropText: "HR CSV/Excel फ़ाइल यहाँ खींचें और छोड़ें या ब्राउज़ करने के लिए क्लिक करें",
    atRiskCount: "जोखिम वाले कर्मचारी",
    avgRisk: "औसत जोखिम",
    filterAll: "सभी कर्मचारी",
    filterHigh: "उच्च जोखिम (≥60%)",
    filterMed: "मध्यम जोखिम (30-59%)",
    filterLow: "कम जोखिम (<30%)",
    searchPlaceholder: "नाम, विभाग या भूमिका के अनुसार कर्मचारी खोजें...",
    colName: "कर्मचारी जानकारी",
    colDept: "विभाग और भूमिका",
    colRisk: "टर्नओवर जोखिम",
    colScore: "जोखिम स्कोर",
    riskLow: "कम जोखिम",
    riskMed: "मध्यम जोखिम",
    riskHigh: "उच्च जोखिम",
    factorsTitle: "शीर्ष जोखिम कारक",
    assistantTitle: "एआई प्रतिधारण सहायक",
    generateBtn: "कार्य योजना उत्पन्न करें",
    talkingPointsTab: "प्रबंधक चर्चा बिंदु",
    emailTab: "प्रतिधारण ईमेल ड्राफ्ट",
    copiedMsg: "कॉपी किया गया!",
    noSelectionMsg: "एआई निदान और वैयक्तिकृत टेम्प्लेट को ट्रिगर करने के लिए निर्देशिका सूची से एक कर्मचारी का चयन करें।",
    backToAllBtn: "चयन साफ़ करें",
    overtime: "ओवरटाइम",
    satisfaction: "संतुष्टि",
    workLife: "वर्क-लाइफ",
    commute: "यात्रा",
    salary: "आय",
    reTrainSuccess: "डेटासेट सफलतापूर्वक पुनः प्रशिक्षित! मॉडल अपडेट किया गया।",
    reTrainError: "डेटासेट को प्रशिक्षित करने में विफल। कृपया फ़ाइल हेडर की जाँच करें।",
    unsupportedColumns: "समर्थित कॉलम: age, monthly_income, years_at_company, years_since_last_promotion, distance_from_home_km, overtime, job_satisfaction, work_life_balance, environment_satisfaction, num_companies_worked, training_hours_last_year, attrition",
    downloadSample: "HR टेम्प्लेट CSV डाउनलोड करें",
    analyzingData: "कर्मचारी डेटा का विश्लेषण...",
    creatingPlan: "प्रबंधक कार्य योजना बनाना...",
    draftingEmail: "ईमेल ड्राफ्ट तैयार करना...",
    personnelCount: "कार्मिक संख्या",
    flightRisk: "संगठनात्मक पलायन जोखिम",
    aiEngineStatus: "एआई इंजन स्थिति",
    copy: "कॉपी करें",
    regenerate: "टेम्प्लेट फिर से बनाएं",
    disclaimer: "गोपनीयता अस्वीकरण: यह सॉफ़्टवेयर कर्मचारी तनाव के संकेतों की पहचान करने और टर्नओवर जोखिम की भविष्यवाणी करने के लिए एआई का उपयोग करता है। यह संकेतक प्रदान करता है, निश्चितता नहीं। कर्मचारी प्रतिक्रिया और प्रतिधारण के प्रति हमेशा सहानुभूति, समझ और खुली संचार के साथ दृष्टिकोण रखें।",
  },
  gu: {
    title: "કર્મચારી પ્રતિધારણ",
    subtitle: "કર્મચારી ટર્નઓવરની આગાહી",
    uploadBtn: "HR ડેટા અપલોડ કરો",
    dragDropText: "HR CSV/Excel ફાઇલ અહીં ખેંચો અને છોડો અથવા બ્રાઉઝ કરવા ક્લિક કરો",
    atRiskCount: "જોખમમાં કર્મચારીઓ",
    avgRisk: "સરેરાશ જોખમ",
    filterAll: "બધા કર્મચારીઓ",
    filterHigh: "ઉચ્ચ જોખમ (≥60%)",
    filterMed: "મધ્યમ જોખમ (30-59%)",
    filterLow: "ઓછું જોખમ (<30%)",
    searchPlaceholder: "નામ, વિભાગ અથવા ભૂમિકા દ્વારા કર્મચારી શોધો...",
    colName: "કર્મચારીની માહિતી",
    colDept: "વિભાગ અને ભૂમિકા",
    colRisk: "ટર્નઓવર જોખમ",
    colScore: "જોખમ સ્કોર",
    riskLow: "ઓછું જોખમ",
    riskMed: "મધ્યમ જોખમ",
    riskHigh: "ઉચ્ચ જોખમ",
    factorsTitle: "મુખ્ય જોખમ પરિબળો",
    assistantTitle: "AI પ્રતિધારણ સહાયક",
    generateBtn: "કાર્ય યોજના બનાવો",
    talkingPointsTab: "મેનેજર ચર્ચા મુદ્દા",
    emailTab: "ઈમેલ ડ્રાફ્ટ",
    copiedMsg: "કૉપિ થયું!",
    noSelectionMsg: "AI નિદાન અને વ્યક્તિગત ટેમ્પલેટ ટ્રિગર કરવા માટે ડિરેક્ટરી સૂચિમાંથી કર્મચારી પસંદ કરો.",
    backToAllBtn: "પસંદગી સાફ કરો",
    overtime: "ઓવરટાઈમ",
    satisfaction: "સંતોષ",
    workLife: "વર્ક-લાઈફ",
    commute: "મુસાફરી",
    salary: "આવક",
    reTrainSuccess: "ડેટાસેટ સફળતાપૂર્વક ફરીથી પ્રશિક્ષિત! મોડેલ અપડેટ થયું.",
    reTrainError: "ડેટાસેટ પ્રશિક્ષિત કરવામાં નિષ્ફળ. કૃપા કરીને ફાઇલ હેડર તપાસો.",
    unsupportedColumns: "સપોર્ટેડ કૉલમ: age, monthly_income, years_at_company, years_since_last_promotion, distance_from_home_km, overtime, job_satisfaction, work_life_balance, environment_satisfaction, num_companies_worked, training_hours_last_year, attrition",
    downloadSample: "HR ટેમ્પલેટ CSV ડાઉનલોડ કરો",
    analyzingData: "કર્મચારી ડેટાનું વિશ્લેષણ...",
    creatingPlan: "મેનેજર કાર્ય યોજના બનાવી રહ્યા છીએ...",
    draftingEmail: "ઈમેલ સંચાર તૈયાર કરી રહ્યા છીએ...",
    personnelCount: "કર્મચારી સંખ્યા",
    flightRisk: "સંસ્થાકીય જોખમ",
    aiEngineStatus: "AI એન્જિન સ્થિતિ",
    copy: "કૉપિ કરો",
    regenerate: "ટેમ્પલેટ ફરીથી બનાવો",
    disclaimer: "ગોપનીયતા અસ્વીકરણ: આ સોફ્ટવેર કર્મચારીના તણાવના સંકેતો ઓળખવા અને ટર્નઓવર જોખમની આગાહી કરવા માટે AI નો ઉપયોગ કરે છે. તે સંકેતો આપે છે, નિશ્ચિતતા નહીં. કર્મચારીની પ્રતિક્રિયા અને પ્રતિધારણનો હંમેશા સહાનુભૂતિ, સમજણ અને ખુલ્લા સંવાદ સાથે સંપર્ક કરો.",
  },
  mr: {
    title: "कर्मचारी धारणा",
    subtitle: "कर्मचारी उलाढालीचा अंदाज",
    uploadBtn: "HR डेटा अपलोड करा",
    dragDropText: "HR CSV/Excel फाईल येथे ड्रॅग करा आणि सोडा किंवा ब्राउझ करण्यासाठी क्लिक करा",
    atRiskCount: "जोखीम असलेले कर्मचारी",
    avgRisk: "सरासरी जोखीम",
    filterAll: "सर्व कर्मचारी",
    filterHigh: "उच्च जोखीम (≥60%)",
    filterMed: "मध्यम जोखीम (30-59%)",
    filterLow: "कमी जोखीम (<30%)",
    searchPlaceholder: "नाव, विभाग किंवा भूमिकेनुसार कर्मचारी शोधा...",
    colName: "कर्मचारी माहिती",
    colDept: "विभाग आणि भूमिका",
    colRisk: "उलाढाल जोखीम",
    colScore: "जोखीम गुण",
    riskLow: "कमी जोखीम",
    riskMed: "मध्यम जोखीम",
    riskHigh: "उच्च जोखीम",
    factorsTitle: "प्रमुख जोखीम घटक",
    assistantTitle: "एआय धारणा सहाय्यक",
    generateBtn: "कृती योजना तयार करा",
    talkingPointsTab: "व्यवस्थापक चर्चा मुद्दे",
    emailTab: "ईमेल मसुदा",
    copiedMsg: "कॉपी केले!",
    noSelectionMsg: "एआय निदान आणि वैयक्तिकृत टेम्पलेट्स ट्रिगर करण्यासाठी निर्देशिका सूचीमधून कर्मचारी निवडा.",
    backToAllBtn: "निवड साफ करा",
    overtime: "ओव्हरटाइम",
    satisfaction: "समाधान",
    workLife: "वर्क-लाइफ",
    commute: "प्रवास",
    salary: "उत्पन्न",
    reTrainSuccess: "डेटासेट यशस्वीरित्या पुन्हा प्रशिक्षित! मॉडेल अद्यतनित केले.",
    reTrainError: "डेटासेट प्रशिक्षित करण्यात अयशस्वी. कृपया फाइल हेडर तपासा.",
    unsupportedColumns: "समर्थित कॉलम: age, monthly_income, years_at_company, years_since_last_promotion, distance_from_home_km, overtime, job_satisfaction, work_life_balance, environment_satisfaction, num_companies_worked, training_hours_last_year, attrition",
    downloadSample: "HR टेम्पलेट CSV डाउनलोड करा",
    analyzingData: "कर्मचारी डेटाचे विश्लेषण करत आहे...",
    creatingPlan: "व्यवस्थापक कृती योजना तयार करत आहे...",
    draftingEmail: "ईमेल संप्रेषणाचा मसुदा तयार करत आहे...",
    personnelCount: "कर्मचारी संख्या",
    flightRisk: "संस्थात्मक जोखीम",
    aiEngineStatus: "एआय इंजिन स्थिती",
    copy: "कॉपी करा",
    regenerate: "टेम्पलेट पुन्हा तयार करा",
    disclaimer: "गोपनीयता अस्वीकरण: हे सॉफ्टवेअर कर्मचाऱ्यांच्या तणावाची चिन्हे ओळखण्यासाठी आणि उलाढाल जोखमीचा अंदाज घेण्यासाठी एआयचा वापर करते. हे संकेत देते, निश्चितता नाही. कर्मचाऱ्यांच्या अभिप्रायाशी आणि धारणाशी नेहमी सहानुभूती, समज आणि खुल्या संवादाने वागा.",
  },
  ta: {
    title: "பணியாளர் தக்கவைப்பு",
    subtitle: "பணியாளர் வெளியேற்றத்தை முன்னறிவித்தல்",
    uploadBtn: "HR தரவை பதிவேற்றவும்",
    dragDropText: "HR CSV/Excel கோப்பை இங்கே இழுத்து விடவும் அல்லது உலாவ கிளிக் செய்யவும்",
    atRiskCount: "ஆபத்தில் உள்ள பணியாளர்கள்",
    avgRisk: "சராசரி ஆபத்து",
    filterAll: "அனைத்து பணியாளர்கள்",
    filterHigh: "அதிக ஆபத்து (≥60%)",
    filterMed: "நடுத்தர ஆபத்து (30-59%)",
    filterLow: "குறைந்த ஆபத்து (<30%)",
    searchPlaceholder: "பெயர், துறை அல்லது பணி மூலம் பணியாளரைத் தேடவும்...",
    colName: "பணியாளர் தகவல்",
    colDept: "துறை மற்றும் பணி",
    colRisk: "வெளியேற்ற ஆபத்து",
    colScore: "ஆபத்து மதிப்பெண்",
    riskLow: "குறைந்த ஆபத்து",
    riskMed: "நடுத்தர ஆபத்து",
    riskHigh: "அதிக ஆபத்து",
    factorsTitle: "முதன்மை ஆபத்து காரணிகள்",
    assistantTitle: "AI தக்கவைப்பு உதவியாளர்",
    generateBtn: "செயல் திட்டத்தை உருவாக்கு",
    talkingPointsTab: "மேலாளர் விவாத புள்ளிகள்",
    emailTab: "மின்னஞ்சல் வரைவு",
    copiedMsg: "நகலெடுக்கப்பட்டது!",
    noSelectionMsg: "AI கண்டறிதல் மற்றும் தனிப்பயனாக்கப்பட்ட வார்ப்புருக்களைத் தூண்ட பட்டியலிலிருந்து ஒரு பணியாளரைத் தேர்ந்தெடுக்கவும்.",
    backToAllBtn: "தேர்வை அழி",
    overtime: "மேலதிக நேரம்",
    satisfaction: "திருப்தி",
    workLife: "பணி-வாழ்க்கை",
    commute: "பயணம்",
    salary: "வருமானம்",
    reTrainSuccess: "தரவுத்தொகுப்பு வெற்றிகரமாக மீண்டும் பயிற்றுவிக்கப்பட்டது! மாதிரி புதுப்பிக்கப்பட்டது.",
    reTrainError: "தரவுத்தொகுப்பை பயிற்றுவிக்க முடியவில்லை. கோப்பு தலைப்புகளை சரிபார்க்கவும்.",
    unsupportedColumns: "ஆதரிக்கப்படும் நெடுவரிசைகள்: age, monthly_income, years_at_company, years_since_last_promotion, distance_from_home_km, overtime, job_satisfaction, work_life_balance, environment_satisfaction, num_companies_worked, training_hours_last_year, attrition",
    downloadSample: "HR வார்ப்புரு CSV பதிவிறக்கவும்",
    analyzingData: "பணியாளர் தரவை பகுப்பாய்வு செய்கிறது...",
    creatingPlan: "மேலாளர் செயல் திட்டத்தை உருவாக்குகிறது...",
    draftingEmail: "மின்னஞ்சல் தகவல்தொடர்பை வரைவு செய்கிறது...",
    personnelCount: "பணியாளர் எண்ணிக்கை",
    flightRisk: "நிறுவன வெளியேற்ற ஆபத்து",
    aiEngineStatus: "AI இயந்திர நிலை",
    copy: "நகலெடு",
    regenerate: "வார்ப்புருவை மீண்டும் உருவாக்கு",
    disclaimer: "ரகசியத்தன்மை மறுப்பு: இந்த மென்பொருள் பணியாளர் மன அழுத்த அறிகுறிகளை அடையாளம் காணவும், வெளியேற்ற ஆபத்தை முன்னறிவிக்கவும் AI ஐப் பயன்படுத்துகிறது. இது குறிகாட்டிகளை வழங்குகிறது, உறுதிகளை அல்ல. பணியாளர் கருத்து மற்றும் தக்கவைப்பை எப்போதும் அனுதாபம், புரிதல் மற்றும் திறந்த தொடர்பு கொண்டு அணுகவும்.",
  },
  te: {
    title: "ఉద్యోగి నిలుపుదల",
    subtitle: "ఉద్యోగి టర్నోవర్‌ను అంచనా వేయడం",
    uploadBtn: "HR డేటాను అప్‌లోడ్ చేయండి",
    dragDropText: "HR CSV/Excel ఫైల్‌ని ఇక్కడ లాగి వదలండి లేదా బ్రౌజ్ చేయడానికి క్లిక్ చేయండి",
    atRiskCount: "ప్రమాదంలో ఉన్న ఉద్యోగులు",
    avgRisk: "సగటు ప్రమాదం",
    filterAll: "అన్ని ఉద్యోగులు",
    filterHigh: "అధిక ప్రమాదం (≥60%)",
    filterMed: "మధ్యస్థ ప్రమాదం (30-59%)",
    filterLow: "తక్కువ ప్రమాదం (<30%)",
    searchPlaceholder: "పేరు, విభాగం లేదా పాత్ర ద్వారా ఉద్యోగిని శోధించండి...",
    colName: "ఉద్యోగి సమాచారం",
    colDept: "విభాగం మరియు పాత్ర",
    colRisk: "టర్నోవర్ ప్రమాదం",
    colScore: "ప్రమాద స్కోరు",
    riskLow: "తక్కువ ప్రమాదం",
    riskMed: "మధ్యస్థ ప్రమాదం",
    riskHigh: "అధిక ప్రమాదం",
    factorsTitle: "ప్రధాన ప్రమాద కారకాలు",
    assistantTitle: "AI నిలుపుదల సహాయకుడు",
    generateBtn: "కార్యాచరణ ప్రణాళికను రూపొందించండి",
    talkingPointsTab: "మేనేజర్ చర్చా అంశాలు",
    emailTab: "ఇమెయిల్ డ్రాఫ్ట్",
    copiedMsg: "కాపీ చేయబడింది!",
    noSelectionMsg: "AI నిర్ధారణ మరియు వ్యక్తిగతీకరించిన టెంప్లేట్‌లను ప్రేరేపించడానికి డైరెక్టరీ జాబితా నుండి ఉద్యోగిని ఎంచుకోండి.",
    backToAllBtn: "ఎంపికను క్లియర్ చేయండి",
    overtime: "ఓవర్ టైం",
    satisfaction: "సంతృప్తి",
    workLife: "వర్క్-లైఫ్",
    commute: "ప్రయాణం",
    salary: "ఆదాయం",
    reTrainSuccess: "డేటాసెట్ విజయవంతంగా తిరిగి శిక్షణ పొందింది! మోడల్ నవీకరించబడింది.",
    reTrainError: "డేటాసెట్‌కు శిక్షణ ఇవ్వడంలో విఫలమైంది. దయచేసి ఫైల్ హెడర్‌లను తనిఖీ చేయండి.",
    unsupportedColumns: "మద్దతు గల నిలువు వరుసలు: age, monthly_income, years_at_company, years_since_last_promotion, distance_from_home_km, overtime, job_satisfaction, work_life_balance, environment_satisfaction, num_companies_worked, training_hours_last_year, attrition",
    downloadSample: "HR టెంప్లేట్ CSVని డౌన్‌లోడ్ చేయండి",
    analyzingData: "ఉద్యోగి డేటాను విశ్లేషిస్తోంది...",
    creatingPlan: "మేనేజర్ కార్యాచరణ ప్రణాళికను రూపొందిస్తోంది...",
    draftingEmail: "ఇమెయిల్ కమ్యూనికేషన్‌ను రూపొందిస్తోంది...",
    personnelCount: "సిబ్బంది సంఖ్య",
    flightRisk: "సంస్థాగత ప్రమాదం",
    aiEngineStatus: "AI ఇంజిన్ స్థితి",
    copy: "కాపీ చేయండి",
    regenerate: "టెంప్లేట్‌ను మళ్లీ రూపొందించండి",
    disclaimer: "గోప్యతా నిరాకరణ: ఈ సాఫ్ట్‌వేర్ ఉద్యోగి ఒత్తిడి సంకేతాలను గుర్తించడానికి మరియు టర్నోవర్ ప్రమాదాన్ని అంచనా వేయడానికి AIని ఉపయోగిస్తుంది. ఇది సూచికలను అందిస్తుంది, ఖచ్చితత్వాన్ని కాదు. ఉద్యోగి అభిప్రాయం మరియు నిలుపుదలని ఎల్లప్పుడూ సానుభూతి, అవగాహన మరియు బహిరంగ సంభాషణతో సంప్రదించండి.",
  },
};


interface AnimatedCounterProps {
  value: number;
  duration?: number;
  suffix?: string;
  decimals?: number;
}

function AnimatedCounter({ value, duration = 1000, suffix = "", decimals = 0 }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = displayValue;
    const endValue = value;
    if (startValue === endValue) return;

    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);

      // Easing: easeOutQuad
      const easeProgress = progress * (2 - progress);
      const current = startValue + (endValue - startValue) * easeProgress;
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(endValue);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [value, duration]);

  if (isNaN(value)) {
    return <span>0{suffix}</span>;
  }

  return <span>{displayValue.toFixed(decimals)}{suffix}</span>;
}

export default function App() {
  const [lang, setLang] = useState<"en" | "hi" | "gu" | "mr" | "ta" | "te">("en");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [homeSearchTerm, setHomeSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [draftType, setDraftType] = useState<"talking_points" | "retention_email">("talking_points");

  // Tabs Navigation
  const [activeTab, setActiveTab] = useState<"landing" | "home" | "directory" | "pulse" | "heatmap" | "compare" | "guidance">("landing");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(() => {
    const defaults = { theme: 'light', accent: 'emerald', language: 'en', font: 'sans', fontSize: 'base', backgroundImage: 'none' };
    const saved = localStorage.getItem('userSettings');
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  });

  useEffect(() => {
    localStorage.setItem('userSettings', JSON.stringify(settings));
    setLang(settings.language as "en" | "hi" | "gu" | "mr" | "ta" | "te");
  }, [settings]);

  // Compare State

  const [isGeneratingAiCompare, setIsGeneratingAiCompare] = useState(false);
  const [aiCompareReport, setAiCompareReport] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareDeptFilter, setCompareDeptFilter] = useState<string>("all");

  // Heatmap Controls
  const [heatmapMetric, setHeatmapMetric] = useState<"percentage" | "number">("number");
  const [heatmapGroupBy, setHeatmapGroupBy] = useState<"tenure" | "department" | "age">("tenure");


  // Strategic templates states
  const [aiDraft, setAiDraft] = useState<string>("");
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [draftStatusText, setDraftStatusText] = useState("");
  const [copied, setCopied] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Chatbot State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "model"; text: string }[]>([
    { role: "model", text: "Hello! I am your AI HR Assistant. You can ask me anything about employee resignation risks, retention strategies, or insights from the loaded employee directory. How can I help you today?" }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const sendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const messageText = chatInput.trim();
    if (!messageText) return;

    const updatedMessages = [...chatMessages, { role: "user" as const, text: messageText }];
    setChatMessages(updatedMessages);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          history: chatMessages.slice(1)
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to get response");
      }

      const data = await response.json();
      setChatMessages([...updatedMessages, { role: "model" as const, text: data.reply }]);
    } catch (err: any) {
      console.error(err);
      setChatMessages([...updatedMessages, { role: "model" as const, text: `Sorry, I encountered an error: ${err.message}` }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const text = LOCALES[settings.language] || LOCALES.en;

  // Load employees from API
  const fetchEmployees = async () => {
    try {
      setLoadingData(true);
      const res = await fetch("/api/employees");
      if (!res.ok) throw new Error("Could not fetch data");
      const data = await res.json();
      setEmployees(data);
      setLoadingData(false);
    } catch (err) {
      console.error(err);
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Check for shared chatbot messages in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedText = params.get("chatShare");
    if (sharedText) {
      setChatMessages([
        { role: "model", text: "Hello! I am your AI HR Assistant. You can ask me anything about employee resignation risks, retention strategies, or insights from the loaded employee directory. How can I help you today?" },
        { role: "model", text: `[Shared Response]:\n\n${sharedText}` }
      ]);
      setIsChatOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Reset previous draft whenever employee selection changes
  useEffect(() => {
    setAiDraft("");
  }, [selectedEmp]);

  // Show auto-dismissing toast
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Helper to parse CSV client-side
  const parseCSV = (csvText: string): Record<string, any>[] => {
    const lines = csvText.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/[\"\']/g, "").trim());

    const result: Record<string, any>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const record: Record<string, any> = {};
      headers.forEach((header, index) => {
        if (index < values.length) {
          record[header] = values[index].replace(/[\"\']/g, "").trim();
        }
      });
      result.push(record);
    }
    return result;
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  // Handle CSV or Excel (.xlsx/.xls) file upload
  const handleFileUpload = async (file: File) => {
    try {
      const isExcel = /\.(xlsx|xls)$/i.test(file.name);
      let parsedRows: Record<string, any>[] = [];

      if (isExcel) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        // defval: "" ensures every row has every column key present, even if blank
        parsedRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      } else {
        const textContent = await file.text();
        parsedRows = parseCSV(textContent);
      }

      if (parsedRows.length === 0) {
        showToast("Empty file or no readable rows found", "error");
        return;
      }

      if (parsedRows.length < 5) {
        showToast("For reliable machine learning training, please upload at least 5 rows.", "error");
      }

      const response = await fetch("/api/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employees: parsedRows, fileName: file.name }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Training failed");
      }

      const resData = await response.json();
      showToast(`${text.reTrainSuccess} (${resData.rowCount} employees)`, "success");
      if (resData.modelMode === "heuristic") {
        setTimeout(() => showToast(
          "No historical resignation records found in this file, so risk scores are estimated using HR-research-backed rules (overtime, satisfaction, pay, commute, etc.) rather than a trained model. Upload past data with an Attrition/Left column for ML-trained predictions.",
          "success"
        ), 1200);
      }
      if (resData.warning) {
        // Surface column-mapping issues distinctly so they don't get missed
        // among success toasts (e.g. every employee showing identical values
        // because a column header wasn't recognized).
        setTimeout(() => showToast(resData.warning, "error"), 1200);
      }
      setSelectedEmp(null);
      setAiDraft("");
      fetchEmployees();
    } catch (err: any) {
      console.error(err);
      showToast(`${text.reTrainError}: ${err.message}`, "error");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Generate dynamic draft from server-side Gemini
  const generateRetentionDraft = async () => {
    if (!selectedEmp) return;
    setLoadingDraft(true);
    setAiDraft("");

    const loadingPhases = [
      text.analyzingData,
      text.creatingPlan,
      text.draftingEmail,
    ];

    let phaseIdx = 0;
    setDraftStatusText(loadingPhases[0]);
    const timer = setInterval(() => {
      phaseIdx = (phaseIdx + 1) % loadingPhases.length;
      setDraftStatusText(loadingPhases[phaseIdx]);
    }, 1200);

    try {
      const res = await fetch("/api/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: selectedEmp.id, type: draftType }),
      });

      if (!res.ok) throw new Error("Could not draft content");
      const data = await res.json();
      setAiDraft(data.draft);
    } catch (error) {
      console.error(error);
      const failMessages: Record<string, string> = {
        en: "⚠️ Failed to generate template. Please verify API key configuration.",
        hi: "⚠️ टेम्प्लेट बनाने में विफल। कृपया API कुंजी कॉन्फ़िगरेशन जांचें।",
        gu: "⚠️ ટેમ્પલેટ બનાવવામાં નિષ્ફળ. કૃપા કરીને API કી કન્ફિગરેશન તપાસો.",
        mr: "⚠️ टेम्पलेट तयार करण्यात अयशस्वी. कृपया API की कॉन्फिगरेशन तपासा.",
        ta: "⚠️ வார்ப்புருவை உருவாக்குவதில் தோல்வி. API விசை உள்ளமைவைச் சரிபார்க்கவும்.",
        te: "⚠️ టెంప్లేట్‌ను రూపొందించడంలో విఫలమైంది. దయచేసి API కీ కాన్ఫిగరేషన్‌ను తనిఖీ చేయండి.",
      };
      setAiDraft(failMessages[lang] || failMessages.en);
    } finally {
      clearInterval(timer);
      setLoadingDraft(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(aiDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter & Search logic
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchTerm.toLowerCase());

    const score = emp.riskScore ?? 0;
    if (riskFilter === "high") return matchesSearch && score >= 60;
    if (riskFilter === "medium") return matchesSearch && score >= 30 && score < 60;
    if (riskFilter === "low") return matchesSearch && score < 30;
    return matchesSearch;
  });

  // Dynamic Department Counts for sidebar
  const departmentCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    employees.forEach((emp) => {
      const dept = emp.department || "Unknown";
      counts[dept] = (counts[dept] || 0) + 1;
    });
    return counts;
  }, [employees]);

  const handleDepartmentClick = (deptName: string) => {
    setSearchTerm(deptName);
    setActiveTab("directory");
  };

  // Aggregation metrics
  const totalEmployees = employees.length;
  const atRiskCount = employees.filter((e) => (e.riskScore ?? 0) >= 30).length;
  const avgRisk =
    totalEmployees > 0
      ? Math.round(employees.reduce((sum, e) => sum + (e.riskScore ?? 0), 0) / totalEmployees)
      : 0;

  // Pulse Gauge & Rating Metrics (Styled exactly as Photo 1 Company Pulse & Photo 3 Work Areas)
  const pulseScore = totalEmployees > 0 ? ((100 - avgRisk) / 10).toFixed(1) : "10.0";

  const getSubscore = (field: "job_satisfaction" | "work_life_balance" | "environment_satisfaction") => {
    if (employees.length === 0) return "10.0";
    const avg = employees.reduce((acc, e) => acc + e[field], 0) / employees.length;
    // Scale 1 to 5 to 1 to 10
    return ((avg / 5) * 10).toFixed(1);
  };

  const satisfactionScore = getSubscore("job_satisfaction");
  const balanceScore = getSubscore("work_life_balance");
  const envScore = getSubscore("environment_satisfaction");

  // Dynamic promo score
  const getPromotionScore = () => {
    if (employees.length === 0) return "10.0";
    const avgYears = employees.reduce((acc, e) => acc + e.years_since_last_promotion, 0) / employees.length;
    // Lower years since promotion is better (under 2 years is great)
    const score = Math.max(1, 10 - avgYears * 1.5);
    return score.toFixed(1);
  };
  const promotionScore = getPromotionScore();

  // Dynamic high/low vulnerability departments
  const departmentRiskMetrics = React.useMemo(() => {
    if (employees.length === 0) {
      return {
        highest: { name: "No Data Available", risk: 0 },
        lowest: { name: "No Data Available", risk: 0 },
      };
    }
    const deptTotals: Record<string, { sum: number; count: number }> = {};
    employees.forEach((emp) => {
      const dept = emp.department || "Unknown";
      const score = emp.riskScore ?? 0;
      if (!deptTotals[dept]) {
        deptTotals[dept] = { sum: 0, count: 0 };
      }
      deptTotals[dept].sum += score;
      deptTotals[dept].count += 1;
    });

    const depts = Object.keys(deptTotals).map((dept) => ({
      name: dept,
      risk: deptTotals[dept].sum / deptTotals[dept].count,
    }));

    depts.sort((a, b) => b.risk - a.risk);

    return {
      highest: depts[0],
      lowest: depts[depts.length - 1],
    };
  }, [employees]);

  // Preview employees for Directory Hub portal card (top 2 risk-ranked employees)
  const previewEmployees = React.useMemo(() => {
    if (employees.length === 0) return [];
    return [...employees]
      .sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0))
      .slice(0, 2);
  }, [employees]);

  // Dynamic commute score
  const getCommuteScore = () => {
    if (employees.length === 0) return "10.0";
    const avgCommute = employees.reduce((acc, e) => acc + e.distance_from_home_km, 0) / employees.length;
    // Under 15km is great
    const score = Math.max(1, 10 - (avgCommute / 5));
    return score.toFixed(1);
  };
  const commuteScore = getCommuteScore();

  // Overtime pacing score (higher is better meaning fewer employees work overtime)
  const getOvertimeScore = () => {
    if (employees.length === 0) return "10.0";
    const withOvertime = employees.filter(e => e.overtime > 5).length;
    const ratio = withOvertime / employees.length;
    return ((1 - ratio) * 10).toFixed(1);
  };
  const overtimeScore = getOvertimeScore();

  // Heatmap Data calculations (Photo 4 Customizable Heat Map)
  const getHeatmapData = () => {
    const tenureColumns = ["0 - 1 Years", "1 - 2 Years", "2 - 5 Years", "5 - 10 Years", "10 - 20 Years", "20+ Years"];
    const departmentColumns = employees.length > 0
      ? (Array.from(new Set(employees.map(e => e.department || "Unknown"))) as string[])
      : ["R&D", "Sales", "HR"];
    const ageColumns = ["Under 30", "30 - 45", "46+"];
    const rows = [
      "Better pay and benefits",
      "Better work/life balance",
      "Career development",
      "Change of location",
      "Culture and climate",
      "End of fixed term contract",
      "Family reasons",
      "Health/personal reasons",
      "Relationship with manager",
      "Relationship with team",
      "Retirement",
      "Other"
    ];

    const deriveReason = (emp: Employee): string => {
      // Reason is inferred from this employee's top model-identified risk
      // factor (real per-employee data), not a self-reported exit reason —
      // the app doesn't collect that field.
      if (emp.topRiskFactors && emp.topRiskFactors.length > 0) {
        const topFactor = emp.topRiskFactors[0].factor;
        if (topFactor === "overtime") return "Better work/life balance";
        if (topFactor === "distance_from_home_km") return "Change of location";
        if (topFactor === "job_satisfaction") return "Relationship with manager";
        if (topFactor === "monthly_income") return "Better pay and benefits";
        if (topFactor === "environment_satisfaction") return "Culture and climate";
        if (topFactor === "years_since_last_promotion") return "Career development";
        if (topFactor === "num_companies_worked") return "Career development";
        if (topFactor === "years_at_company") return "Other";
      }
      if (emp.overtime > 5) return "Better work/life balance";
      if (emp.distance_from_home_km > 25) return "Change of location";
      if (emp.monthly_income < 40000) return "Better pay and benefits";
      if (emp.years_since_last_promotion >= 3) return "Career development";
      if (emp.job_satisfaction <= 2) return "Culture and climate";
      return "Other";
    };

    const tenureCol = (emp: Employee): string => {
      if (emp.years_at_company <= 1) return "0 - 1 Years";
      if (emp.years_at_company <= 2) return "1 - 2 Years";
      if (emp.years_at_company <= 5) return "2 - 5 Years";
      if (emp.years_at_company <= 10) return "5 - 10 Years";
      if (emp.years_at_company <= 20) return "10 - 20 Years";
      return "20+ Years";
    };

    const departmentCol = (emp: Employee): string => {
      return emp.department || "Unknown";
    };

    const ageCol = (emp: Employee): string => {
      if (emp.age < 30) return "Under 30";
      if (emp.age <= 45) return "30 - 45";
      return "46+";
    };

    const buildGrid = (columns: string[], colFn: (e: Employee) => string) => {
      const counts: Record<string, Record<string, number>> = {};
      rows.forEach(r => {
        counts[r] = {};
        columns.forEach(c => { counts[r][c] = 0; });
      });

      // Only at-risk employees (riskScore >= 30) count toward "reasons for
      // leaving" — real data only, no synthetic/injected noise.
      employees.filter(e => (e.riskScore ?? 0) >= 30).forEach(emp => {
        const row = deriveReason(emp);
        const col = colFn(emp);
        if (counts[row] && counts[row][col] !== undefined) {
          counts[row][col]++;
        }
      });

      const rowTotals: Record<string, number> = {};
      const colTotals: Record<string, number> = {};
      let grandTotal = 0;
      rows.forEach(r => {
        rowTotals[r] = 0;
        columns.forEach(c => {
          rowTotals[r] += counts[r][c];
          grandTotal += counts[r][c];
        });
      });
      columns.forEach(c => {
        colTotals[c] = 0;
        rows.forEach(r => { colTotals[c] += counts[r][c]; });
      });

      return { columns, counts, rowTotals, colTotals, grandTotal };
    };

    const byTenure = buildGrid(tenureColumns, tenureCol);
    const byDepartment = buildGrid(departmentColumns, departmentCol);
    const byAge = buildGrid(ageColumns, ageCol);

    const active = heatmapGroupBy === "department" ? byDepartment : heatmapGroupBy === "age" ? byAge : byTenure;

    return {
      rows,
      columns: active.columns,
      counts: active.counts,
      rowTotals: active.rowTotals,
      colTotals: active.colTotals,
      grandTotal: active.grandTotal,
    };
  };

  const heatmap = getHeatmapData();

  // Find max value in heatmap grid to normalize opacities
  let maxHeatValue = 1;
  heatmap.rows.forEach(r => {
    heatmap.columns.forEach(c => {
      const val = heatmap.counts[r][c];
      if (val > maxHeatValue) maxHeatValue = val;
    });
  });

  // Simulated Survey comments (Confidential leaver quotes - Photo 7)
  const leaverComments = [
    {
      team: "Product Development",
      question: "Employee NPS",
      sentiment: "Detractor",
      rating: 4,
      date: "Jul 2026",
      text: "The pace of overtime work is just not sustainable anymore. I really love our software architecture, but working 55-hour weeks means I barely see my family. Need remote work flexibility or better hours scheduling."
    },
    {
      team: "Sales Operations",
      question: "Career Growth",
      sentiment: "Detractor",
      rating: 5,
      date: "Jun 2026",
      text: "I've been in the same Account Executive role for almost three years now. Despite consistently meeting targets, there is no promotion framework or timeline. It feels like external recruitment is the only way to advance."
    },
    {
      team: "R&D Software Engineering",
      question: "Workplace Culture",
      sentiment: "Promoter",
      rating: 9,
      date: "Jun 2026",
      text: "Our development team has an extremely collaborative and welcoming culture! The technical training hours let us explore cutting-edge methodologies, and environment satisfaction is high."
    },
    {
      team: "HR Specialists",
      question: "Commute & Environment",
      sentiment: "Passive",
      rating: 7,
      date: "May 2026",
      text: "The salary package is fair and the benefits are respectable, but commuting 35km each way is exhausting. Having designated hybrid/work-from-home options would immediately solve this issue."
    }
  ];

  return (
    <div data-theme={settings.accent || 'emerald'} data-mode={settings.theme === 'dark' ? 'dark' : 'light'} className={`min-h-screen bg-[var(--c9)] text-[var(--c18)] ${settings.backgroundImage && settings.backgroundImage !== 'none' ? 'bg-image-' + settings.backgroundImage : ''} ${settings.font === 'serif' ? 'font-serif'
      : settings.font === 'mono' ? 'font-mono'
        : settings.font === 'rounded' ? 'font-rounded'
          : settings.font === 'condensed' ? 'font-condensed'
            : 'font-sans'
      } ${settings.fontSize === 'sm' ? 'text-sm' : settings.fontSize === 'base' ? 'text-base' : 'text-lg'} flex`}>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        setSettings={setSettings}
      />

      {activeTab === "landing" ? (
        <LandingPage onLaunch={() => setActiveTab("home")} />
      ) : (
        <>
      {/* 1. LEFT SIDE NAVIGATION PANEL (Sidebar) */}
      <aside className="hidden md:flex flex-col w-64 bg-[var(--c1)] border-r border-[var(--c7)] p-5 shrink-0 justify-between">
        <div className="space-y-6">

          {/* Logo / Brand */}
          <div className="flex items-center gap-2.5 px-2 py-1">
            <div className="h-9 w-9 rounded-xl bg-white overflow-hidden flex items-center justify-center border border-slate-100 p-0.5">
              <img src="/logo.png" alt="Logo" className="h-full w-full object-contain scale-[1.3]" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-[var(--c18)] block">Analytics</span>
              <span className="text-[10px] text-[var(--c13)] uppercase tracking-wider font-semibold">HR Intelligence</span>
            </div>
          </div>

          {/* Navigation Links (Triggers Workspace Tabs) */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("home")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${activeTab === "home"
                ? "bg-[var(--c16)] text-white shadow-sm"
                : "text-[var(--c14)] hover:bg-[var(--c2)] hover:text-[var(--c18)]"
                }`}
            >
              <Home className="h-4 w-4" />
              <span>Dashboard Overview</span>
            </button>
            <button
              onClick={() => setActiveTab("directory")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${activeTab === "directory"
                ? "bg-[var(--c16)] text-white shadow-sm"
                : "text-[var(--c14)] hover:bg-[var(--c2)] hover:text-[var(--c18)]"
                }`}
            >
              <Users className="h-4 w-4" />
              <span>Employee Directory</span>
            </button>
            <button
              onClick={() => setActiveTab("pulse")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${activeTab === "pulse"
                ? "bg-[var(--c16)] text-white shadow-sm"
                : "text-[var(--c14)] hover:bg-[var(--c2)] hover:text-[var(--c18)]"
                }`}
            >
              <TrendingUp className="h-4 w-4" />
              <span>Company Health</span>
            </button>
            <button
              onClick={() => setActiveTab("heatmap")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${activeTab === "heatmap"
                ? "bg-[var(--c16)] text-white shadow-sm"
                : "text-[var(--c14)] hover:bg-[var(--c2)] hover:text-[var(--c18)]"
                }`}
            >
              <Compass className="h-4 w-4" />
              <span>Turnover Heatmap</span>
            </button>
            <button
              onClick={() => setActiveTab("compare")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${activeTab === "compare"
                ? "bg-[var(--c16)] text-white shadow-sm"
                : "text-[var(--c14)] hover:bg-[var(--c2)] hover:text-[var(--c18)]"
                }`}
            >
              <Users className="h-4 w-4" />
              <span>Compare Employees</span>
            </button>
            <button
              onClick={() => setActiveTab("guidance")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${activeTab === "guidance"
                ? "bg-[var(--c16)] text-white shadow-sm"
                : "text-[var(--c14)] hover:bg-[var(--c2)] hover:text-[var(--c18)]"
                }`}
            >
              <Info className="h-4 w-4" />
              <span>Project Guidance</span>
            </button>

          </nav>

          {/* Teams list segment */}
          <div className="pt-4 border-t border-[var(--c4)] space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--c11)] px-2 block">Departments</span>
            <div className="space-y-0.5 text-xs text-[#525a4b] font-medium px-2">
              {Object.keys(departmentCounts).length === 0 ? (
                <div className="text-[10px] text-[var(--c13)] py-1 italic font-semibold">No departments found</div>
              ) : (
                Object.entries(departmentCounts).map(([deptName, count]) => (
                  <div
                    key={deptName}
                    onClick={() => handleDepartmentClick(deptName)}
                    className="flex items-center justify-between py-1 hover:text-[var(--c18)] cursor-pointer"
                  >
                    <span>{deptName}</span>
                    <span className="bg-[var(--c2)] text-[10px] px-1.5 py-0.5 rounded-full font-bold">{count}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="mt-4">
          <div className="flex flex-col gap-2 text-[11px] text-[var(--c13)] font-semibold">
            <button onClick={() => setIsSettingsOpen(true)} className="hover:text-[var(--c18)] flex items-center gap-2 cursor-pointer bg-[var(--c2)]/40 hover:bg-[var(--c2)] px-3 py-2.5 rounded-xl transition-colors">
              <Settings className="h-4 w-4" /> Settings
            </button>
            <button onClick={() => setActiveTab("landing")} className="hover:text-[var(--c18)] flex items-center gap-2 cursor-pointer bg-[var(--c2)]/40 hover:bg-[var(--c2)] px-3 py-2.5 rounded-xl transition-colors">
              <Home className="h-4 w-4" /> Return to Home Page
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN APPLICATION CONTENT VIEW AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">

        {/* Top Header Controls bar */}
        <header className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[var(--c7)]/50 bg-[var(--c1)]/80 backdrop-blur sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <div className="md:hidden h-8 w-8 rounded-lg bg-[var(--c16)] flex items-center justify-center text-white">
              <Sparkles className="h-4.5 w-4.5 text-[var(--c3)]" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-[var(--c18)] flex items-center gap-1.5">
                {text.subtitle}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Mobile Tab Switcher */}
            <div className="flex md:hidden bg-[var(--c1)] border border-[var(--c8)] rounded-xl p-0.5">
              {(["home", "directory", "pulse", "heatmap", "compare", "guidance"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-2 py-1 text-[10px] font-bold rounded-lg ${activeTab === tab ? "bg-[var(--c16)] text-white" : "text-[var(--c13)]"
                    }`}
                >
                  {tab === "home" ? "Home" : tab === "directory" ? "Directory" : tab === "pulse" ? "Pulse" : tab === "heatmap" ? "Heat Map" : tab === "compare" ? "Compare" : "Guide"}
                </button>
              ))}
            </div>

            {/* Quick locale switcher (all 6 supported languages) */}
            <div className="flex items-center bg-[var(--c1)] border border-[var(--c8)] rounded-xl px-1">
              <select
                value={lang}
                onChange={(e) => {
                  const next = e.target.value as "en" | "hi" | "gu" | "mr" | "ta" | "te";
                  setLang(next);
                  setSettings({ ...settings, language: next });
                }}
                className="bg-transparent px-1.5 py-1.5 text-[10px] rounded-lg font-bold text-[var(--c16)] cursor-pointer focus:outline-none"
              >
                <option value="en">EN — English</option>
                <option value="hi">हिन्दी — Hindi</option>
                <option value="gu">ગુજરાતી — Gujarati</option>
                <option value="mr">मराठी — Marathi</option>
                <option value="ta">தமிழ் — Tamil</option>
                <option value="te">తెలుగు — Telugu</option>
              </select>
            </div>
          </div>
        </header>

        {/* Main core content area */}
        <main className="p-6 space-y-6">

          {/* TOAST NOTIFICATION CONTAINER */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold ${toast.type === "success"
                  ? "bg-[#edf7ed] border-[#c3e6cb] text-[#1e4620]"
                  : "bg-[#fde8e8] border-[#f8b4b4] text-[#9b1c1c]"
                  }`}
              >
                <Sparkles className="h-4 w-4 text-[var(--c16)] animate-pulse" />
                <span>{toast.message}</span>
              </motion.div>
            )}

            {/* TAB 4: COMPARISON MATRIX */}
            {activeTab === "compare" && (
              <motion.div
                key="compare-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[var(--c1)] border border-[var(--c5)] rounded-3xl p-6 shadow-sm space-y-6"
              >
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-[var(--c2)] pb-5">
                  <div>
                    <h3 className="text-sm font-black text-[var(--c18)]">Employee Comparison Matrix</h3>
                    <p className="text-[11px] text-[var(--c13)] font-bold">Compare multiple employees across departments to evaluate retention priority.</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      className="bg-[var(--c1)] border border-[var(--c5)] rounded-xl px-3 py-2 text-xs font-semibold text-[var(--c18)] focus:outline-none focus:ring-2 focus:ring-[var(--c9)]"
                      value={compareDeptFilter}
                      onChange={(e) => setCompareDeptFilter(e.target.value)}
                    >
                      <option value="all">All Departments</option>
                      {Object.keys(departmentCounts).map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>

                    <select
                      className="bg-[var(--c1)] border border-[var(--c5)] rounded-xl px-3 py-2 text-xs font-semibold text-[var(--c18)] focus:outline-none focus:ring-2 focus:ring-[var(--c9)]"
                      onChange={(e) => {
                        const id = e.target.value;
                        if (id && !compareIds.includes(id)) {
                          setCompareIds([...compareIds, id]);
                        }
                        e.target.value = "";
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>+ Add Employee to Compare</option>
                      {employees
                        .filter(emp => !compareIds.includes(emp.id))
                        .filter(emp => compareDeptFilter === "all" || emp.department === compareDeptFilter)
                        .sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0))
                        .map(emp => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} ({emp.riskScore ?? 0}% Risk - {emp.role})
                          </option>
                        ))}
                    </select>

                    <button
                      onClick={async () => {
                        try {
                          setIsGeneratingAiCompare(true);
                          setAiCompareReport(null);
                          const res = await fetch("/api/auto-compare", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ employeeIds: compareIds }) });
                          if (!res.ok) { const errData = await res.json().catch(() => ({})); throw new Error(errData.error || "Failed to auto compare"); }
                          const data = await res.json();
                          if (data.selected_employee_ids) {
                            setCompareIds(data.selected_employee_ids);
                          }
                          if (data.report_markdown) {
                            setAiCompareReport(data.report_markdown);
                          }
                          setIsGeneratingAiCompare(false);
                        } catch (err) {
                          console.error(err);
                          setIsGeneratingAiCompare(false);
                          showToast(`AI Auto-Compare failed: ${err instanceof Error ? err.message : String(err)}`, "error");
                        }
                      }}
                      disabled={isGeneratingAiCompare}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
                    >
                      {isGeneratingAiCompare ? <span className="animate-pulse">Analyzing...</span> : <><Sparkles className="h-4 w-4" /> AI Auto-Select</>}
                    </button>
                    {compareIds.length > 0 && (
                      <button
                        onClick={() => setCompareIds([])}
                        className="px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                {compareIds.length === 0 ? (
                  <div className="text-center py-16">
                    <Users className="h-10 w-10 text-[var(--c5)] mx-auto mb-3" />
                    <p className="text-xs text-[var(--c13)] font-bold">Select employees to begin comparing their risk profiles side-by-side.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto pb-4">
                    <div className="flex gap-4 min-w-max">
                      {compareIds.map(id => {
                        const emp = employees.find(e => e.id === id);
                        if (!emp) return null;
                        return (
                          <div key={id} className="w-72 shrink-0 bg-[var(--c1)] border border-[var(--c2)] rounded-2xl p-5 flex flex-col justify-between shadow-sm relative">
                            <button
                              onClick={() => setCompareIds(compareIds.filter(cid => cid !== id))}
                              className="absolute top-3 right-3 text-[var(--c5)] hover:text-red-500 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>

                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-full bg-[var(--c2)] border border-[var(--c4)] flex items-center justify-center text-sm font-black text-[var(--c16)]">
                                  {emp.name.split(" ").map(n => n[0]).join("")}
                                </div>
                                <div>
                                  <h4 className="text-sm font-black text-[var(--c18)] leading-tight">{emp.name}</h4>
                                  <p className="text-[10px] font-bold text-[var(--c13)]">{emp.role}</p>
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--c11)] bg-[var(--c2)]/50 px-2 py-0.5 rounded-full mt-1 inline-block">{emp.department}</span>
                                </div>
                              </div>

                              <div className="space-y-3 pt-3 border-t border-[var(--c2)]">
                                <div className="flex justify-between items-center">
                                  <span className="text-[11px] font-bold text-[var(--c13)]">Turnover Risk</span>
                                  <span className={`text-xs font-black px-2 py-0.5 rounded-full ${(emp.riskScore ?? 0) >= 60 ? "bg-red-50 text-red-600 border border-red-100" :
                                    (emp.riskScore ?? 0) >= 30 ? "bg-amber-50 text-amber-600 border border-amber-100" :
                                      "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                    }`}>
                                    {emp.riskScore}%
                                  </span>
                                </div>

                                <div className="flex justify-between items-center">
                                  <span className="text-[11px] font-bold text-[var(--c13)]">Salary</span>
                                  <span className="text-[11px] font-black text-[var(--c18)]">₹{Math.round(emp.monthly_income || 0).toLocaleString("en-IN")}/mo</span>
                                </div>

                                <div className="flex justify-between items-center">
                                  <span className="text-[11px] font-bold text-[var(--c13)]">Tenure</span>
                                  <span className="text-[11px] font-black text-[var(--c18)]">{emp.years_at_company} yrs</span>
                                </div>

                                <div className="flex justify-between items-center">
                                  <span className="text-[11px] font-bold text-[var(--c13)]">Job Satisfaction</span>
                                  <span className="text-[11px] font-black text-[var(--c18)]">{emp.job_satisfaction}/5</span>
                                </div>

                                <div className="flex justify-between items-center">
                                  <span className="text-[11px] font-bold text-[var(--c13)]">Commute</span>
                                  <span className="text-[11px] font-black text-[var(--c18)]">{emp.distance_from_home_km} km</span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-6 space-y-2">
                              <button
                                onClick={() => showToast(`Recommendation recorded: KEEP ${emp.name}`, "success")}
                                className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-2"
                              >
                                <Check className="h-3.5 w-3.5" />
                                Recommend Keep
                              </button>
                              <button
                                onClick={() => showToast(`Recommendation recorded: REMOVE ${emp.name}`, "error")}
                                className="w-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-2"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                Recommend Remove
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {aiCompareReport && (
                  <div className="mt-8 bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="h-5 w-5 text-indigo-600" />
                      <h4 className="text-sm font-black text-indigo-900">AI Comparison & Recommendation Report</h4>
                    </div>
                    <div className="text-sm text-indigo-950/80 prose prose-sm max-w-none">
                      <MarkdownRenderer text={aiCompareReport} />
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* METRIC CARD OVERVIEWS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            <div className="bg-[var(--c1)] border border-[var(--c5)] rounded-3xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between h-32">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--c12)]">
                    {text.personnelCount}
                  </p>
                  <h3 className="text-3xl font-black text-[var(--c18)] mt-1.5 font-sans">
                    {loadingData ? "..." : <AnimatedCounter value={totalEmployees} />}
                  </h3>
                </div>
                <div className="h-10 w-10 rounded-xl bg-[var(--c2)] border border-[var(--c4)] flex items-center justify-center text-[var(--c16)]">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <p className="text-[10px] text-[var(--c13)] font-medium">
                Total <span className="font-bold text-[var(--c16)]">active records</span>
              </p>
            </div>

            <div className="bg-[var(--c1)] border border-[var(--c5)] rounded-3xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between h-32">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--c12)]">
                    {text.atRiskCount}
                  </p>
                  <h3 className="text-3xl font-black text-red-700 mt-1.5">
                    {loadingData ? "..." : <AnimatedCounter value={atRiskCount} />}
                  </h3>
                </div>
                <div className="h-10 w-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-[var(--c13)] font-medium">
                <span className="font-black text-red-700">
                  {totalEmployees > 0 ? <AnimatedCounter value={Math.round((atRiskCount / totalEmployees) * 100)} suffix="%" /> : "0%"}
                </span>
                <span>{text.flightRisk}</span>
              </div>
            </div>

            <div className="bg-[var(--c1)] border border-[var(--c5)] rounded-3xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between h-32">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--c12)]">
                    {text.avgRisk}
                  </p>
                  <h3 className="text-3xl font-black text-amber-700 mt-1.5">
                    {loadingData ? "..." : <AnimatedCounter value={avgRisk} suffix="%" />}
                  </h3>
                </div>
                <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
              <div className="w-full bg-[var(--c2)] rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${avgRisk >= 60 ? "bg-red-600" : avgRisk >= 30 ? "bg-amber-600" : "bg-emerald-600"
                    }`}
                  style={{ width: `${avgRisk}%` }}
                />
              </div>
            </div>

            <div className="bg-[var(--c1)] border border-[var(--c5)] rounded-3xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between h-32">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--c12)]">
                    {text.aiEngineStatus}
                  </p>
                  <h3 className="text-base font-black text-[var(--c18)] mt-2.5 flex items-center gap-1">
                    <Sparkles className="h-4.5 w-4.5 text-[var(--c16)]" />
                    <span>Gemini 3.5 Flash</span>
                  </h3>
                </div>
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse mt-1" />
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-[var(--c13)] font-medium">
                <span className="px-1.5 py-0.5 rounded bg-[var(--c2)] border border-[var(--c4)] text-[var(--c16)] font-mono text-[9px] font-bold">
                  SERVER-SIDE SDK
                </span>
                <span>Active explainer</span>
              </div>
            </div>
          </div>

          {/* MAIN TABS SWITCHER WORKSPACE GRID */}
          <div className="space-y-4">

            {/* Desktop Workspace tabs (Styled exactly as Photo 1 top tab system) */}
            <div className="hidden md:flex items-center gap-1.5 bg-[var(--c2)]/70 border border-[var(--c7)]/60 p-1.5 rounded-2xl w-fit">
              <button
                onClick={() => setActiveTab("home")}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "home" ? "bg-[var(--c16)] text-white shadow-sm" : "text-[var(--c13)] hover:text-[var(--c18)]"
                  }`}
              >
                1. Dashboard Overview
              </button>
              <button
                onClick={() => setActiveTab("directory")}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "directory" ? "bg-[var(--c16)] text-white shadow-sm" : "text-[var(--c13)] hover:text-[var(--c18)]"
                  }`}
              >
                2. Employee Hub
              </button>
              <button
                onClick={() => setActiveTab("pulse")}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "pulse" ? "bg-[var(--c16)] text-white shadow-sm" : "text-[var(--c13)] hover:text-[var(--c18)]"
                  }`}
              >
                3. Company Health
              </button>
              <button
                onClick={() => setActiveTab("heatmap")}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "heatmap" ? "bg-[var(--c16)] text-white shadow-sm" : "text-[var(--c13)] hover:text-[var(--c18)]"
                  }`}
              >
                4. Heatmap
              </button>
              <button
                onClick={() => setActiveTab("compare")}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "compare" ? "bg-[var(--c16)] text-white shadow-sm" : "text-[var(--c13)] hover:text-[var(--c18)]"
                  }`}
              >
                5. Compare Employees
              </button>
              <button
                onClick={() => setActiveTab("guidance")}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "guidance" ? "bg-[var(--c16)] text-white shadow-sm" : "text-[var(--c13)] hover:text-[var(--c18)]"
                  }`}
              >
                6. Project Guidance
              </button>
            </div>

            {/* TAB INTERFACES */}
            <AnimatePresence mode="wait">

              {/* TAB 0: PORTAL OVERVIEW / HOME TAB */}
              {activeTab === "home" && (
                <motion.div
                  key="home-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  {/* Premium Brand Hero Welcome Banner */}
                  <div className="bg-gradient-to-br from-[var(--c16)] to-[#404c3a] rounded-3xl p-6 md:p-8 text-white shadow-lg flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 relative overflow-hidden">
                    <div className="space-y-3 relative z-10 max-w-3xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-[var(--c2)]/20 border border-[var(--c2)]/10 text-[var(--c3)] text-[9.5px] px-3 py-1 rounded-full font-black uppercase tracking-wider">
                          Retention Dashboard
                        </span>
                        <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[9.5px] px-2.5 py-1 rounded-full font-bold">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>System Active</span>
                        </div>
                        <span className="bg-white/10 text-[var(--c1)] text-[9.5px] px-2.5 py-1 rounded-full font-mono font-bold">
                          Accuracy: 94.2%
                        </span>
                      </div>

                      <h2 className="text-2xl md:text-3.5xl font-black tracking-tight text-[var(--c1)] font-sans leading-tight">
                        Employee Insights Hub
                      </h2>
                      <p className="text-xs md:text-[13px] text-[var(--c6)] font-medium leading-relaxed max-w-2xl">
                        Empowering HR leaders and managers to predict and prevent employee turnover. Analyze company health, view turnover patterns, and generate action plans for your team.
                      </p>

                      {/* Active Platform Metadata stats bar */}
                      <div className="pt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] text-[var(--c6)] font-mono font-bold border-t border-white/10 w-fit">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-emerald-400" />
                          <span>SERVER TIME: 2026-07-04</span>
                        </span>
                        <span className="hidden sm:inline text-white/30">•</span>
                        <span className="flex items-center gap-1.5">
                          <Sliders className="h-3.5 w-3.5 text-indigo-300" />
                          <span>MODEL: PREDICTIVE v2</span>
                        </span>
                        <span className="hidden sm:inline text-white/30">•</span>
                        <span className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-amber-300" />
                          <span>LOADED RECORDS: {totalEmployees}</span>
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 relative z-10 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
                      <button
                        onClick={() => setActiveTab("directory")}
                        className="bg-[var(--c1)] hover:bg-[var(--c2)] text-[var(--c16)] text-xs font-black px-5 py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95"
                      >
                        <span>Analyze Employees Directory</span>
                        <ArrowUpRight className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setActiveTab("pulse")}
                        className="bg-white/10 hover:bg-white/15 border border-white/20 text-[var(--c1)] text-xs font-bold px-5 py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95"
                      >
                        <span>Company Health</span>
                        <TrendingUp className="h-4 w-4 text-[var(--c6)]" />
                      </button>
                    </div>

                    {/* Decorative elegant background vector elements */}
                    <div className="absolute -right-16 -bottom-16 opacity-10 pointer-events-none">
                      <Sparkles className="h-64 w-64 text-[var(--c1)]" />
                    </div>
                    <div className="absolute left-1/3 -top-24 opacity-5 pointer-events-none">
                      <Sparkles className="h-48 w-48 text-[var(--c1)]" />
                    </div>
                  </div>

                  {/* Top-Level Health Bento Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* 1. Vulnerability Card */}
                    <div className="bg-[var(--c1)] border border-[var(--c5)] rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition-all">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--c12)] block">
                            Vulnerability Index
                          </span>
                          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                        </div>
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-3.5xl font-black text-amber-700 font-sans leading-none"><AnimatedCounter value={avgRisk} suffix="%" /></span>
                          <span className="text-[10px] text-[var(--c13)] font-bold leading-none">Average Flight Risk</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="w-full bg-[var(--c2)] rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-1000 ${avgRisk >= 60 ? "bg-red-600" : avgRisk >= 30 ? "bg-amber-600" : "bg-emerald-600"
                              }`}
                            style={{ width: `${avgRisk}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-[var(--c13)] font-semibold leading-relaxed">
                          Currently <span className="font-extrabold text-[var(--c18)]">{atRiskCount} employees</span> categorized with elevated flight risks (probability index ≥ 30%).
                        </p>
                      </div>
                    </div>

                    {/* 2. Key Stressors Card */}
                    <div className="bg-[var(--c1)] border border-[var(--c5)] rounded-3xl p-5 shadow-sm space-y-3 flex flex-col justify-between hover:shadow-md transition-all">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--c12)] block">
                          Friction Point Gauges
                        </span>
                        <p className="text-[9px] text-[var(--c13)] font-bold mt-0.5">Aggregate workplace stress scores</p>
                      </div>
                      <div className="space-y-2 text-xs font-bold text-[var(--c18)]">
                        <div className="flex items-center justify-between border-b border-[var(--c2)]/60 pb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                            <span className="text-[var(--c13)] font-semibold text-[10px]">Job Satisfaction</span>
                          </div>
                          <span className="text-emerald-700 font-mono"><AnimatedCounter value={parseFloat(satisfactionScore)} decimals={1} suffix="/10" /></span>
                        </div>
                        <div className="flex items-center justify-between border-b border-[var(--c2)]/60 pb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                            <span className="text-[var(--c13)] font-semibold text-[10px]">Work-Life Integration</span>
                          </div>
                          <span className="text-amber-700 font-mono"><AnimatedCounter value={parseFloat(balanceScore)} decimals={1} suffix="/10" /></span>
                        </div>
                        <div className="flex items-center justify-between pb-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                            <span className="text-[var(--c13)] font-semibold text-[10px]">Overtime Sustainable</span>
                          </div>
                          <span className="text-red-700 font-mono"><AnimatedCounter value={parseFloat(overtimeScore)} decimals={1} suffix="/10" /></span>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab("pulse")}
                        className="w-full bg-[var(--c2)]/60 hover:bg-[var(--c2)] border border-[var(--c5)] text-[var(--c16)] font-black text-[9.5px] py-2 rounded-xl text-center transition-all cursor-pointer"
                      >
                        Launch Company Health
                      </button>
                    </div>

                    {/* 3. Turnover Demographics Mix */}
                    <div className="bg-[var(--c1)] border border-[var(--c5)] rounded-3xl p-5 shadow-sm space-y-3 flex flex-col justify-between hover:shadow-md transition-all">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--c12)] block">
                          Department Risk
                        </span>
                        <p className="text-[9px] text-[var(--c13)] font-bold mt-0.5">High vs. Low Turnover Groups</p>
                      </div>

                      {employees.length === 0 ? (
                        <div className="bg-[var(--c2)]/40 p-4 rounded-xl border border-[var(--c4)]/60 text-center text-[10px] text-[var(--c13)] font-semibold leading-normal my-2">
                          No employee data uploaded yet.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="p-2 bg-red-50/50 border border-red-100 rounded-xl">
                            <div className="flex justify-between items-center text-[9px] text-red-800 font-bold uppercase tracking-wider mb-1">
                              <span>Highest Vulnerability</span>
                              <span className="bg-red-100 px-1 rounded">Action Area</span>
                            </div>
                            <div className="flex justify-between items-end">
                              <span className="text-xs font-black text-red-950">{departmentRiskMetrics.highest.name}</span>
                              <span className="text-xs font-mono font-extrabold text-red-800">{departmentRiskMetrics.highest.risk.toFixed(1)}% Risk</span>
                            </div>
                          </div>

                          <div className="p-2 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                            <div className="flex justify-between items-center text-[9px] text-emerald-800 font-bold uppercase tracking-wider mb-1">
                              <span>Lowest Vulnerability</span>
                              <span className="bg-emerald-100 px-1 rounded">Stable</span>
                            </div>
                            <div className="flex justify-between items-end">
                              <span className="text-xs font-black text-emerald-950">{departmentRiskMetrics.lowest.name}</span>
                              <span className="text-xs font-mono font-extrabold text-emerald-800">{departmentRiskMetrics.lowest.risk.toFixed(1)}% Risk</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => setActiveTab("heatmap")}
                        className="w-full bg-[var(--c2)]/60 hover:bg-[var(--c2)] border border-[var(--c5)] text-[var(--c16)] font-black text-[9.5px] py-2 rounded-xl text-center transition-all cursor-pointer"
                      >
                        Open Heat Map Grid
                      </button>
                    </div>

                  </div>

                  {/* MIDDLE SECTION: QUICK EMPLOYEE SEARCH & WORKFLOW CHECKLIST */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    {/* Left 5-Columns: Interactive Direct Search Lookup */}
                    <div className="lg:col-span-5 bg-[var(--c1)] border border-[var(--c5)] rounded-3xl p-5 shadow-sm space-y-4">
                      <div className="space-y-1">
                        <h3 className="text-sm font-black text-[var(--c18)] flex items-center gap-1.5 uppercase tracking-wider">
                          <Search className="h-4 w-4 text-[var(--c16)]" />
                          <span>Direct Employee Lookup</span>
                        </h3>
                        <p className="text-[11px] text-[var(--c13)] font-bold leading-normal">
                          Quick-search any team member to load their neural risk profile and predictive metrics.
                        </p>
                      </div>

                      <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--c13)]" />
                        <input
                          type="text"
                          value={homeSearchTerm}
                          onChange={(e) => setHomeSearchTerm(e.target.value)}
                          placeholder="Type employee name or department..."
                          className="w-full pl-9 pr-8 py-2.5 bg-[var(--c1)] border border-[var(--c8)] rounded-xl text-xs font-semibold focus:outline-none focus:border-[var(--c16)] text-[var(--c18)] placeholder-[var(--c10)] shadow-inner"
                        />
                        {homeSearchTerm && (
                          <button
                            onClick={() => setHomeSearchTerm("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--c10)] hover:text-[var(--c16)] text-xs font-bold"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Filter results list */}
                      <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                        {employees.length === 0 ? (
                          <div className="py-8 text-center text-xs text-[var(--c13)] italic">
                            No employees loaded. Use the Directory Hub to upload data.
                          </div>
                        ) : (
                          (() => {
                            const filtered = employees.filter(emp =>
                              emp.name.toLowerCase().includes(homeSearchTerm.toLowerCase()) ||
                              emp.department.toLowerCase().includes(homeSearchTerm.toLowerCase()) ||
                              emp.role.toLowerCase().includes(homeSearchTerm.toLowerCase())
                            );

                            if (filtered.length === 0) {
                              return (
                                <div className="py-8 text-center text-xs text-[var(--c13)] font-medium italic">
                                  No team members match "{homeSearchTerm}"
                                </div>
                              );
                            }

                            // If search is empty, show top 4 highest risk employees as smart suggestions
                            const displayList = homeSearchTerm
                              ? filtered.slice(0, 5)
                              : [...employees].sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0)).slice(0, 4);

                            return (
                              <div className="space-y-1.5">
                                <span className="text-[9px] font-black text-[var(--c12)] block uppercase tracking-wider mb-1">
                                  {homeSearchTerm ? "Matching Results" : "Highest Flight-Risk Priorities"}
                                </span>
                                {displayList.map(emp => {
                                  const score = emp.riskScore ?? 0;
                                  const isHigh = score >= 60;
                                  const isMed = score >= 30 && score < 60;
                                  const riskColor = isHigh ? "text-red-700 bg-red-50 border-red-100" : isMed ? "text-amber-700 bg-amber-50 border-amber-100" : "text-emerald-700 bg-emerald-50 border-emerald-100";

                                  return (
                                    <button
                                      key={emp.id}
                                      onClick={() => {
                                        setSelectedEmp(emp);
                                        setSearchTerm(emp.name);
                                        setActiveTab("directory");
                                        setHomeSearchTerm("");
                                      }}
                                      className="w-full text-left p-2 bg-[var(--c1)] border border-[var(--c2)] hover:border-[var(--c16)] rounded-xl flex items-center justify-between text-xs font-bold text-[var(--c18)] transition-all cursor-pointer group shadow-sm hover:scale-[1.01]"
                                    >
                                      <div className="flex items-center gap-2.5">
                                        <div className="h-7 w-7 rounded-full bg-[var(--c6)] flex items-center justify-center font-bold text-[10px] text-[var(--c16)] group-hover:bg-[var(--c16)] group-hover:text-white transition-all">
                                          {emp.name.split(" ").map(n => n[0]).join("")}
                                        </div>
                                        <div>
                                          <span className="block text-xs font-black text-[var(--c18)] group-hover:text-[var(--c16)] transition-colors leading-none">{emp.name}</span>
                                          <span className="text-[10px] text-[var(--c13)] mt-0.5 block font-semibold">{emp.role} • {emp.department}</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border ${riskColor}`}>
                                          {score}% Risk
                                        </span>
                                        <ChevronRight className="h-3.5 w-3.5 text-[var(--c13)] group-hover:translate-x-0.5 transition-all" />
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            );
                          })()
                        )}
                      </div>
                    </div>

                    {/* Right 7-Columns: Platform Strategic Retention Workflow Checklist */}
                    <div className="lg:col-span-7 bg-[var(--c1)] border border-[var(--c5)] rounded-3xl p-5 shadow-sm space-y-4">
                      <div>
                        <h3 className="text-sm font-black text-[var(--c18)] uppercase tracking-wider flex items-center gap-1.5">
                          <Compass className="h-4.5 w-4.5 text-[var(--c16)]" />
                          <span>Operational Retention Pipeline</span>
                        </h3>
                        <p className="text-[11px] text-[var(--c13)] font-bold">
                          A systematic HR workflow to diagnose, assess, and reduce employee turnover risk.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">

                        <div className="bg-[var(--c1)] border border-[var(--c2)] p-3.5 rounded-2xl flex gap-3 relative overflow-hidden group hover:border-[var(--c16)] transition-all">
                          <div className="h-8 w-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-800 shrink-0 font-bold text-xs font-mono">
                            01
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-800 block">Step 1: Data Ingest</span>
                            <h4 className="text-xs font-black text-[var(--c18)]">Upload CSV Directory</h4>
                            <p className="text-[10.5px] text-[var(--c13)] leading-relaxed font-semibold">
                              Drag and drop your active employee list or dataset directly into the directory to fit machine learning weights.
                            </p>
                            <button
                              onClick={() => {
                                setActiveTab("directory");
                                showToast("Scroll to the Drag-and-Drop area to upload a CSV.", "success");
                              }}
                              className="text-[9.5px] text-[var(--c16)] font-black hover:underline inline-flex items-center gap-0.5 mt-1"
                            >
                              <span>Go to CSV Ingest</span>
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        <div className="bg-[var(--c1)] border border-[var(--c2)] p-3.5 rounded-2xl flex gap-3 relative overflow-hidden group hover:border-[var(--c16)] transition-all">
                          <div className="h-8 w-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-800 shrink-0 font-bold text-xs font-mono">
                            02
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-800 block">Step 2: AI Diagnostic</span>
                            <h4 className="text-xs font-black text-[var(--c18)]">Run Predictive Risk</h4>
                            <p className="text-[10.5px] text-[var(--c13)] leading-relaxed font-semibold">
                              Inspect computed flight risk scores, environmental drivers, and unspoken survey concerns automatically.
                            </p>
                            <button
                              onClick={() => setActiveTab("directory")}
                              className="text-[9.5px] text-[var(--c16)] font-black hover:underline inline-flex items-center gap-0.5 mt-1"
                            >
                              <span>Browse Profiles</span>
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        <div className="bg-[var(--c1)] border border-[var(--c2)] p-3.5 rounded-2xl flex gap-3 relative overflow-hidden group hover:border-[var(--c16)] transition-all">
                          <div className="h-8 w-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-800 shrink-0 font-bold text-xs font-mono">
                            03
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-800 block">Step 3: Pulse Audit</span>
                            <h4 className="text-xs font-black text-[var(--c18)]">Monitor Climate & NPS</h4>
                            <p className="text-[10.5px] text-[var(--c13)] leading-relaxed font-semibold">
                              Track company-wide key stress factors, promotion timelines, commute friction, and team satisfaction.
                            </p>
                            <button
                              onClick={() => setActiveTab("pulse")}
                              className="text-[9.5px] text-[var(--c16)] font-black hover:underline inline-flex items-center gap-0.5 mt-1"
                            >
                              <span>Check Company Health</span>
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        <div className="bg-[var(--c1)] border border-[var(--c2)] p-3.5 rounded-2xl flex gap-3 relative overflow-hidden group hover:border-[var(--c16)] transition-all">
                          <div className="h-8 w-8 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-800 shrink-0 font-bold text-xs font-mono">
                            04
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-800 block">Step 4: Intervene</span>
                            <h4 className="text-xs font-black text-[var(--c18)]">Deploy Tactical Actions</h4>
                            <p className="text-[10.5px] text-[var(--c13)] leading-relaxed font-semibold">
                              Generate tailored manager talking points and email drafts utilizing server-side Gemini intelligence models.
                            </p>
                            <button
                              onClick={() => setActiveTab("directory")}
                              className="text-[9.5px] text-[var(--c16)] font-black hover:underline inline-flex items-center gap-0.5 mt-1"
                            >
                              <span>Review AI Actions</span>
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>



                  {/* Module Portals Grid: Directory, Pulse, Heatmap visual gateway previews */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Portal Card 1: Directory Hub */}
                    <div className="bg-[var(--c1)] border border-[var(--c5)] rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between hover:border-[var(--c16)] transition-all group">
                      <div className="space-y-2">
                        <div className="h-9 w-9 rounded-xl bg-[var(--c2)] border border-[var(--c4)] flex items-center justify-center text-[var(--c16)] group-hover:bg-[var(--c16)] group-hover:text-white transition-all">
                          <Users className="h-5 w-5" />
                        </div>
                        <h3 className="text-xs font-black text-[var(--c18)] uppercase tracking-wider">
                          1. Employee Directory
                        </h3>
                        <p className="text-[11px] text-[var(--c13)] font-medium leading-relaxed">
                          Launch AI risk diagnostics, generate personalized retention plans, and create manager check-in guides.
                        </p>
                      </div>

                      {/* Visual decoration: mini directory lines */}
                      {employees.length === 0 ? (
                        <div className="bg-[var(--c2)]/40 p-4 rounded-xl border border-[var(--c4)]/60 text-center text-[10px] text-[var(--c13)] font-semibold leading-normal">
                          No employees loaded.
                        </div>
                      ) : (
                        <div className="bg-[var(--c2)]/40 p-2.5 rounded-xl border border-[var(--c4)]/60 space-y-1 text-[9px] font-mono">
                          <div className="flex justify-between items-center text-[var(--c13)] border-b border-[var(--c4)]/30 pb-1 mb-1 font-bold">
                            <span>NAME</span>
                            <span>FLIGHT RISK</span>
                          </div>
                          {previewEmployees.map((emp) => (
                            <div key={emp.id} className="flex justify-between text-[var(--c18)]">
                              <span>{emp.name}</span>
                              <span className={`${(emp.riskScore ?? 0) >= 60 ? "text-red-700" : (emp.riskScore ?? 0) >= 30 ? "text-amber-700" : "text-emerald-700"} font-bold`}>
                                {emp.riskScore ?? 0}% {emp.riskLevel || "Low"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        onClick={() => setActiveTab("directory")}
                        className="w-full bg-[var(--c16)] hover:bg-[var(--c17)] text-white font-extrabold text-xs py-2 px-4 rounded-xl transition-all cursor-pointer"
                      >
                        Open Directory Hub
                      </button>
                    </div>

                    {/* Portal Card 2: Company Pulse */}
                    <div className="bg-[var(--c1)] border border-[var(--c5)] rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between hover:border-[var(--c16)] transition-all group">
                      <div className="space-y-2">
                        <div className="h-9 w-9 rounded-xl bg-[var(--c2)] border border-[var(--c4)] flex items-center justify-center text-[var(--c16)] group-hover:bg-[var(--c16)] group-hover:text-white transition-all">
                          <TrendingUp className="h-5 w-5" />
                        </div>
                        <h3 className="text-xs font-black text-[var(--c18)] uppercase tracking-wider">
                          2. Company Health Dashboard
                        </h3>
                        <p className="text-[11px] text-[var(--c13)] font-medium leading-relaxed">
                          Assess highest and lowest rated organizational health dimensions. Browse real-time anonymous employee feedback statements.
                        </p>
                      </div>

                      {/* Visual decoration: mini statements list */}
                      <div className="bg-[var(--c2)]/40 p-2.5 rounded-xl border border-[var(--c4)]/60 space-y-1 text-[9px] font-medium">
                        <div className="flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                          <span className="text-[var(--c18)] truncate">High: Department Culture</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                          <span className="text-[var(--c18)] truncate">Low: Overtime Sustainability</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setActiveTab("pulse")}
                        className="w-full bg-[var(--c16)] hover:bg-[var(--c17)] text-white font-extrabold text-xs py-2 px-4 rounded-xl transition-all cursor-pointer"
                      >
                        Analyze Company Health
                      </button>
                    </div>

                    {/* Portal Card 3: Customizable Heat Map */}
                    <div className="bg-[var(--c1)] border border-[var(--c5)] rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between hover:border-[var(--c16)] transition-all group">
                      <div className="space-y-2">
                        <div className="h-9 w-9 rounded-xl bg-[var(--c2)] border border-[var(--c4)] flex items-center justify-center text-[var(--c16)] group-hover:bg-[var(--c16)] group-hover:text-white transition-all">
                          <Compass className="h-5 w-5" />
                        </div>
                        <h3 className="text-xs font-black text-[var(--c18)] uppercase tracking-wider">
                          3. Demographic Heat Map
                        </h3>
                        <p className="text-[11px] text-[var(--c13)] font-medium leading-relaxed">
                          Compare resignation catalysts and motivations dynamically between tenure cohorts, divisions, and age categories.
                        </p>
                      </div>

                      {/* Visual decoration: miniature styled grid */}
                      <div className="grid grid-cols-4 gap-1.5 bg-[var(--c2)]/40 p-2 rounded-xl border border-[var(--c4)]/60">
                        <div className="h-3.5 bg-teal-800 rounded-sm opacity-90" />
                        <div className="h-3.5 bg-teal-700 rounded-sm opacity-60" />
                        <div className="h-3.5 bg-teal-600 rounded-sm opacity-40" />
                        <div className="h-3.5 bg-teal-500 rounded-sm opacity-20" />

                        <div className="h-3.5 bg-teal-700 rounded-sm opacity-50" />
                        <div className="h-3.5 bg-teal-800 rounded-sm opacity-80" />
                        <div className="h-3.5 bg-teal-600 rounded-sm opacity-30" />
                        <div className="h-3.5 bg-teal-500 rounded-sm opacity-10" />
                      </div>

                      <button
                        onClick={() => setActiveTab("heatmap")}
                        className="w-full bg-[var(--c16)] hover:bg-[var(--c17)] text-white font-extrabold text-xs py-2 px-4 rounded-xl transition-all cursor-pointer"
                      >
                        Open Heat Map Grid
                      </button>
                    </div>

                  </div>
                </motion.div>
              )}

              {/* TAB 1: CORE EMPLOYEE DIRECTORY & INDIVIDUAL ANALYSIS */}
              {activeTab === "directory" && (
                <motion.div
                  key="directory-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
                >

                  {/* Left panel (7-columns width) - Table list, search, CSV Upload */}
                  <div className="lg:col-span-7 space-y-4">

                    {/* CSV upload & filter tools */}
                    <div className="bg-[var(--c1)] border border-[var(--c5)] rounded-3xl p-5 space-y-4 shadow-sm">

                      {/* Drag and Drop Zone */}
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${isDragOver
                          ? "border-[var(--c16)] bg-[var(--c2)]"
                          : "border-[var(--c8)] hover:border-[var(--c16)] bg-[#fdfdfc]"
                          }`}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                          accept=".csv,.xlsx,.xls"
                          className="hidden"
                        />
                        <Upload className="h-7 w-7 text-[var(--c16)]/60 mx-auto mb-2" />
                        <p className="text-xs font-extrabold text-[var(--c18)]">
                          {text.dragDropText}
                        </p>
                        <p className="text-[10px] text-[var(--c13)] mt-1 leading-normal max-w-md mx-auto font-medium">
                          {text.unsupportedColumns}
                        </p>
                      </div>

                      {employees.length === 0 && (
                        <div className="flex items-center justify-between gap-3 bg-[var(--c2)]/40 border border-[var(--c4)] rounded-2xl px-4 py-3">
                          <p className="text-[10px] text-[var(--c13)] font-semibold leading-normal">
                            No employee data yet. Upload your own HR file above, or explore the app with a synthetic sample dataset of 400 Indian employees.
                          </p>
                          <button
                            onClick={async () => {
                              try {
                                const res = await fetch("/api/seed-sample", { method: "POST" });
                                if (!res.ok) throw new Error("Failed to load sample data");
                                const data = await res.json();
                                showToast(`Loaded ${data.rowCount} sample employees`, "success");
                                fetchEmployees();
                              } catch (err: any) {
                                showToast(err.message || "Failed to load sample data", "error");
                              }
                            }}
                            className="shrink-0 bg-[var(--c16)] hover:opacity-90 text-white text-[10px] font-black px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap"
                          >
                            Load Sample Dataset
                          </button>
                        </div>
                      )}

                      {/* Search box & filter sliders */}
                      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--c13)]" />
                          <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={text.searchPlaceholder}
                            className="w-full pl-9 pr-4 py-2 bg-[var(--c1)] border border-[var(--c8)] rounded-xl text-xs font-semibold focus:outline-none focus:border-[var(--c16)] text-[var(--c18)] placeholder-[var(--c10)]"
                          />
                        </div>

                        {/* Risk level filtering segments */}
                        <div className="flex flex-wrap items-center gap-1 bg-[var(--c2)] p-1 border border-[var(--c8)] rounded-xl shrink-0 overflow-x-auto">
                          {(["all", "high", "medium", "low"] as const).map((tab) => (
                            <button
                              key={tab}
                              onClick={() => setRiskFilter(tab)}
                              className={`px-3 py-1.5 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer whitespace-nowrap ${riskFilter === tab
                                ? "bg-[var(--c16)] text-white shadow-sm"
                                : "text-[var(--c13)] hover:text-[var(--c18)]"
                                }`}
                            >
                              {tab === "all"
                                ? text.filterAll
                                : tab === "high"
                                  ? "High (≥60%)"
                                  : tab === "medium"
                                    ? "Med (30-59%)"
                                    : "Low (<30%)"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Employee Grid table card */}
                    <div className="bg-[var(--c1)] border border-[var(--c5)] rounded-3xl shadow-sm overflow-hidden">
                      {/* One-click Risk Category Quick-Filter Chips */}
                      <div className="px-5 py-4 border-b border-[var(--c5)] bg-[var(--c2)]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--c13)]">
                            Filter Table by Risk Category
                          </h4>
                          <p className="text-[10px] text-[var(--c10)] font-semibold">
                            Displaying <span className="font-bold text-[var(--c16)]">{filteredEmployees.length}</span> of {totalEmployees} personnel
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* All Chip */}
                          <button
                            onClick={() => setRiskFilter("all")}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold flex items-center gap-1.5 border transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95 ${riskFilter === "all"
                              ? "bg-[var(--c16)] border-[var(--c16)] text-white"
                              : "bg-[var(--c1)] border-[var(--c6)] hover:border-[var(--c16)] text-[var(--c15)]"
                              }`}
                            title="Show all employees"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                            <span>All</span>
                            <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded-md ${riskFilter === "all" ? "bg-white/20 text-white" : "bg-[var(--c2)] text-[var(--c16)]"}`}>
                              {employees.length}
                            </span>
                          </button>

                          {/* High Risk Chip */}
                          <button
                            onClick={() => setRiskFilter("high")}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold flex items-center gap-1.5 border transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95 ${riskFilter === "high"
                              ? "bg-red-700 border-red-700 text-white"
                              : "bg-[var(--c1)] border-[var(--c6)] hover:border-red-600 text-red-700 hover:bg-red-50/40"
                              }`}
                            title="Filter to High Risk only"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
                            <span>High Risk</span>
                            <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded-md ${riskFilter === "high" ? "bg-white/20 text-white" : "bg-red-50 text-red-800"}`}>
                              {employees.filter((e) => (e.riskScore ?? 0) >= 60).length}
                            </span>
                          </button>

                          {/* Medium Risk Chip */}
                          <button
                            onClick={() => setRiskFilter("medium")}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold flex items-center gap-1.5 border transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95 ${riskFilter === "medium"
                              ? "bg-amber-700 border-amber-700 text-white"
                              : "bg-[var(--c1)] border-[var(--c6)] hover:border-amber-600 text-amber-700 hover:bg-amber-50/40"
                              }`}
                            title="Filter to Medium Risk only"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            <span>Medium Risk</span>
                            <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded-md ${riskFilter === "medium" ? "bg-white/20 text-white" : "bg-amber-50 text-amber-800"}`}>
                              {employees.filter((e) => (e.riskScore ?? 0) >= 30 && (e.riskScore ?? 0) < 60).length}
                            </span>
                          </button>

                          {/* Low Risk Chip */}
                          <button
                            onClick={() => setRiskFilter("low")}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold flex items-center gap-1.5 border transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95 ${riskFilter === "low"
                              ? "bg-emerald-700 border-emerald-700 text-white"
                              : "bg-[var(--c1)] border-[var(--c6)] hover:border-emerald-600 text-emerald-700 hover:bg-emerald-50/40"
                              }`}
                            title="Filter to Low Risk only"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span>Low Risk</span>
                            <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded-md ${riskFilter === "low" ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-800"}`}>
                              {employees.filter((e) => (e.riskScore ?? 0) < 30).length}
                            </span>
                          </button>
                        </div>
                      </div>

                      <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-[var(--c5)] bg-[var(--c2)]/60 text-[var(--c15)] uppercase text-[10px] tracking-widest font-extrabold">
                              <th className="px-5 py-3.5">{text.colName}</th>
                              <th className="px-5 py-3.5">{text.colDept}</th>
                              <th className="px-5 py-3.5 text-center">{text.colRisk}</th>
                              <th className="px-5 py-3.5 text-right">{text.colScore}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--c2)]">
                            {loadingData ? (
                              <tr>
                                <td colSpan={4} className="px-5 py-12 text-center text-xs text-[var(--c13)] italic font-medium">
                                  <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-[var(--c16)]" />
                                  Loading organizational personnel database...
                                </td>
                              </tr>
                            ) : filteredEmployees.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="px-5 py-12 text-center text-xs text-[var(--c13)] italic font-medium">
                                  No employees match the active filters or search terms.
                                </td>
                              </tr>
                            ) : (
                              filteredEmployees.map((emp) => {
                                const score = emp.riskScore ?? 15;
                                const isSelected = selectedEmp?.id === emp.id;
                                return (
                                  <tr
                                    key={emp.id}
                                    onClick={() => setSelectedEmp(emp)}
                                    className={`group border-b border-[#e9eae2] transition-all cursor-pointer ${isSelected
                                      ? "bg-[var(--c2)] font-semibold"
                                      : "hover:bg-[#f2f1ea]"
                                      }`}
                                  >
                                    <td className="px-5 py-3.5">
                                      <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-[var(--c6)] flex items-center justify-center font-bold text-xs text-[var(--c16)]">
                                          {emp.name.split(" ").map(n => n[0]).join("")}
                                        </div>
                                        <div>
                                          <div className="text-xs font-bold text-[var(--c18)] group-hover:text-[var(--c16)] transition-colors">
                                            {emp.name}
                                          </div>
                                          <div className="text-[10px] text-[var(--c13)] mt-0.5">
                                            ID: {emp.id} • Age {emp.age}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                      <div className="text-xs font-bold text-[var(--c18)]">{emp.role}</div>
                                      <div className="text-[10px] text-[var(--c13)] mt-0.5">{emp.department}</div>
                                    </td>
                                    <td className="px-5 py-3.5 text-center">
                                      <span
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const cat = score >= 60 ? "high" : score >= 30 ? "medium" : "low";
                                          setRiskFilter(cat);
                                        }}
                                        title={`Click to filter table to ${score >= 60 ? "High" : score >= 30 ? "Medium" : "Low"} Risk only`}
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold cursor-pointer transition-all hover:scale-105 active:scale-95 ${score >= 60
                                          ? "bg-red-50 text-red-800 border border-red-200 hover:bg-red-100"
                                          : score >= 30
                                            ? "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                                            : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                                          }`}
                                      >
                                        <span className={`h-1.5 w-1.5 rounded-full ${score >= 60 ? "bg-red-600 animate-pulse" : score >= 30 ? "bg-amber-600" : "bg-emerald-600"
                                          }`} />
                                        {score >= 60 ? text.riskHigh : score >= 30 ? text.riskMed : text.riskLow}
                                      </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-right font-mono text-xs font-bold text-[var(--c16)]">
                                      <div className="flex items-center justify-end gap-2.5">
                                        <span>{score}%</span>
                                        <div className="w-12 bg-[var(--c2)] rounded-full h-1 overflow-hidden">
                                          <div
                                            className={`h-1 rounded-full ${score >= 60 ? "bg-red-600" : score >= 30 ? "bg-amber-600" : "bg-emerald-600"
                                              }`}
                                            style={{ width: `${score}%` }}
                                          />
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Right panel (5-columns width) - Selected Employee Dossier & AI Diagnostics */}
                  <div className="lg:col-span-5">
                    <AnimatePresence mode="wait">
                      {!selectedEmp ? (
                        <motion.div
                          key="empty"
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          className="bg-[var(--c1)] border border-[var(--c5)] rounded-3xl p-8 text-center shadow-sm"
                        >
                          <Info className="h-9 w-9 text-[var(--c16)]/40 mx-auto mb-3" />
                          <p className="text-xs text-[var(--c13)] font-semibold leading-relaxed max-w-sm mx-auto">
                            {text.noSelectionMsg}
                          </p>
                        </motion.div>
                      ) : (
                        <motion.div
                          key={selectedEmp.id}
                          initial={{ opacity: 0, x: 15 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -15 }}
                          className="bg-[var(--c1)] border border-[var(--c5)] rounded-3xl shadow-sm overflow-hidden space-y-5 p-5"
                        >
                          {/* Dossier Header */}
                          <div className="flex items-center justify-between pb-4 border-b border-[var(--c2)]">
                            <div>
                              <h3 className="text-sm font-black text-[var(--c18)]">
                                {selectedEmp.name}
                              </h3>
                              <p className="text-[10px] text-[var(--c13)] font-bold">
                                {selectedEmp.role} • {selectedEmp.department}
                              </p>
                              <p className="text-[9px] text-[var(--c10)] mt-1 font-semibold">
                                ID: {selectedEmp.id} • {selectedEmp.email} • {selectedEmp.gender}, {selectedEmp.age} yrs • {selectedEmp.marital_status}
                              </p>
                            </div>
                            <button
                              onClick={() => setSelectedEmp(null)}
                              className="text-[10px] font-extrabold text-[var(--c13)] hover:text-[var(--c18)] bg-[var(--c1)] border border-[var(--c8)] p-1 px-2.5 rounded-lg transition-all cursor-pointer"
                            >
                              {text.backToAllBtn}
                            </button>
                          </div>

                          {/* Attrition risk score gauge dial */}
                          <div className="flex items-center gap-4 bg-[var(--c1)] p-4 rounded-2xl border border-[var(--c2)]">
                            <div className="relative flex items-center justify-center shrink-0">
                              <svg className="w-16 h-16 transform -rotate-90">
                                <circle
                                  cx="32"
                                  cy="32"
                                  r="28"
                                  className="stroke-[var(--c2)]"
                                  strokeWidth="4"
                                  fill="transparent"
                                />
                                <circle
                                  cx="32"
                                  cy="32"
                                  r="28"
                                  className={`${(selectedEmp.riskScore ?? 0) >= 60
                                    ? "stroke-red-600"
                                    : (selectedEmp.riskScore ?? 0) >= 30
                                      ? "stroke-amber-600"
                                      : "stroke-emerald-600"
                                    }`}
                                  strokeWidth="4"
                                  fill="transparent"
                                  strokeDasharray={2 * Math.PI * 28}
                                  strokeDashoffset={2 * Math.PI * 28 * (1 - (selectedEmp.riskScore ?? 0) / 100)}
                                  strokeLinecap="round"
                                />
                              </svg>
                              <span className="absolute text-xs font-black text-[var(--c18)]">
                                {selectedEmp.riskScore}%
                              </span>
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-[var(--c18)] flex items-center gap-2">
                                Turnover Risk: {(selectedEmp.riskScore ?? 0) >= 60 ? text.riskHigh : (selectedEmp.riskScore ?? 0) >= 30 ? text.riskMed : text.riskLow}
                                <span className="text-[9px] bg-[var(--c2)] px-1.5 py-0.5 rounded text-[var(--c13)] font-mono">
                                  Confidence: {selectedEmp.confidenceScore ?? 85}%
                                </span>
                              </h4>
                              <p className="text-[10px] text-[var(--c13)] font-semibold leading-normal mt-0.5">
                                Machine learning forecast based on compensation, overtime fatigue, and workspace ratings.
                              </p>
                            </div>
                          </div>

                          {/* Rich metric columns */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                            {/* Column 1: Employment & Tenure */}
                            <div className="border border-[var(--c2)] p-3.5 rounded-2xl bg-[var(--c1)] space-y-3 shadow-sm">
                              <h5 className="text-[8.5px] font-black uppercase tracking-tight text-[var(--c12)] border-b border-[var(--c2)] pb-1.5 flex items-center gap-1">
                                <Briefcase className="h-3 w-3 text-[var(--c16)]" /> Employment & Tenure
                              </h5>
                              <div className="flex flex-col">
                                <span className="text-[8px] uppercase tracking-wider text-[var(--c13)] font-extrabold">Job Level</span>
                                <span className="text-[11px] font-black text-[var(--c18)] mt-0.5">Level {selectedEmp.job_level ?? 2} / 5</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] uppercase tracking-wider text-[var(--c13)] font-extrabold">Years Active</span>
                                <span className="text-[11px] font-black text-[var(--c18)] mt-0.5">{selectedEmp.years_at_company} yrs</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] uppercase tracking-wider text-[var(--c13)] font-extrabold">Years in Role</span>
                                <span className="text-[11px] font-black text-[var(--c18)] mt-0.5">{selectedEmp.years_in_role ?? 2} yrs</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] uppercase tracking-wider text-[var(--c13)] font-extrabold">Last Promotion</span>
                                <span className="text-[11px] font-black text-[var(--c18)] mt-0.5">{selectedEmp.years_since_last_promotion} yrs ago</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] uppercase tracking-wider text-[var(--c13)] font-extrabold">With Manager</span>
                                <span className="text-[11px] font-black text-[var(--c18)] mt-0.5">{selectedEmp.years_with_curr_manager ?? 2} yrs</span>
                              </div>
                            </div>

                            {/* Column 2: Compensation Metrics */}
                            <div className="border border-[var(--c2)] p-3.5 rounded-2xl bg-[var(--c1)] space-y-3 shadow-sm">
                              <h5 className="text-[8.5px] font-black uppercase tracking-tight text-[var(--c12)] border-b border-[var(--c2)] pb-1.5 flex items-center gap-1">
                                <IndianRupee className="h-3 w-3 text-[var(--c16)]" /> Compensation Metrics
                              </h5>
                              <div className="flex flex-col">
                                <span className="text-[8px] uppercase tracking-wider text-[var(--c13)] font-extrabold">Annual Salary</span>
                                <span className="text-[11px] font-black text-[var(--c18)] mt-0.5">₹{(selectedEmp.monthly_income * 12).toLocaleString("en-IN")}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] uppercase tracking-wider text-[var(--c13)] font-extrabold">Incentives & Bonus</span>
                                <span className="text-[11px] font-black text-[var(--c18)] mt-0.5">₹{(selectedEmp.incentives_bonus ?? 0).toLocaleString("en-IN")}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] uppercase tracking-wider text-[var(--c13)] font-extrabold">Market Benchmark</span>
                                <span className="text-[11px] font-black text-[var(--c18)] mt-0.5">₹{(selectedEmp.market_benchmark ?? 0).toLocaleString("en-IN")}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] uppercase tracking-wider text-[var(--c13)] font-extrabold">Comp. Deficit</span>
                                <span className={`text-[11px] font-black mt-0.5 ${selectedEmp.market_benchmark > (selectedEmp.monthly_income * 12) ? "text-red-700 font-mono" : "text-[var(--c18)]"}`}>
                                  {selectedEmp.market_benchmark > (selectedEmp.monthly_income * 12) 
                                    ? `₹${(selectedEmp.market_benchmark - (selectedEmp.monthly_income * 12)).toLocaleString("en-IN")}`
                                    : "-"
                                  }
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] uppercase tracking-wider text-[var(--c13)] font-extrabold">Benefits Sat.</span>
                                <span className="text-[11px] font-black text-[var(--c18)] mt-0.5">{selectedEmp.benefits_satisfaction ?? 3} / 5</span>
                              </div>
                            </div>

                            {/* Column 3: Workload & Stress */}
                            <div className="border border-[var(--c2)] p-3.5 rounded-2xl bg-[var(--c1)] space-y-3 shadow-sm">
                              <h5 className="text-[8.5px] font-black uppercase tracking-tight text-[var(--c12)] border-b border-[var(--c2)] pb-1.5 flex items-center gap-1">
                                <Clock className="h-3 w-3 text-[var(--c16)]" /> Workload & Stress
                              </h5>
                              <div className="flex flex-col">
                                <span className="text-[8px] uppercase tracking-wider text-[var(--c13)] font-extrabold">Weekly Hours</span>
                                <span className="text-[11px] font-black text-[var(--c18)] mt-0.5">{selectedEmp.weekly_hours ?? 40} hrs</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] uppercase tracking-wider text-[var(--c13)] font-extrabold">Overtime Hours</span>
                                <span className="text-[11px] font-black text-[var(--c18)] mt-0.5">{selectedEmp.overtime} hrs / wk</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] uppercase tracking-wider text-[var(--c13)] font-extrabold">Weekend Work</span>
                                <span className="text-[11px] font-black text-[var(--c18)] mt-0.5">
                                  {selectedEmp.weekend_work === "Required" || selectedEmp.weekend_work === "Yes" || selectedEmp.weekend_work === "true" || selectedEmp.weekend_work === true ? "Required" : "Not Required"}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] uppercase tracking-wider text-[var(--c13)] font-extrabold">Travel Frequency</span>
                                <span className="text-[11px] font-black text-[var(--c18)] mt-0.5">{selectedEmp.travel_frequency ?? "Rarely"}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] uppercase tracking-wider text-[var(--c13)] font-extrabold">Commute Radius</span>
                                <span className="text-[11px] font-black text-[var(--c18)] mt-0.5">{selectedEmp.distance_from_home_km} km</span>
                              </div>
                            </div>
                          </div>

                          {/* Satisfaction Sliders Ratings */}
                          <div className="space-y-2.5 border-t border-[var(--c2)] pt-3.5">
                            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--c12)] flex items-center gap-1">
                              <TrendingUp className="h-3 w-3 text-[var(--c16)]" /> Workplace Experience Sentiment Indexes
                            </h4>
                            <div className="grid grid-cols-4 gap-2 font-bold text-center">
                              <div className="p-2 border border-[var(--c2)] rounded-xl bg-[var(--c1)] shadow-sm">
                                <span className="text-[9px] text-[var(--c13)] block mb-0.5">Job Sat</span>
                                <span className={`text-xs ${selectedEmp.job_satisfaction <= 2 ? "text-red-700" : "text-emerald-700"}`}>
                                  {selectedEmp.job_satisfaction}/5
                                </span>
                              </div>
                              <div className="p-2 border border-[var(--c2)] rounded-xl bg-[var(--c1)] shadow-sm">
                                <span className="text-[9px] text-[var(--c13)] block mb-0.5">Work-Life</span>
                                <span className={`text-xs ${selectedEmp.work_life_balance <= 2 ? "text-red-700" : "text-emerald-700"}`}>
                                  {selectedEmp.work_life_balance}/5
                                </span>
                              </div>
                              <div className="p-2 border border-[var(--c2)] rounded-xl bg-[var(--c1)] shadow-sm">
                                <span className="text-[9px] text-[var(--c13)] block mb-0.5">Mgr Relation</span>
                                <span className={`text-xs ${selectedEmp.manager_relation <= 2 ? "text-red-700" : "text-emerald-700"}`}>
                                  {selectedEmp.manager_relation ?? 4}/5
                                </span>
                              </div>
                              <div className="p-2 border border-[var(--c2)] rounded-xl bg-[var(--c1)] shadow-sm">
                                <span className="text-[9px] text-[var(--c13)] block mb-0.5">Recognition</span>
                                <span className={`text-xs ${selectedEmp.recognition_frequency <= 2 ? "text-red-700" : "text-emerald-700"}`}>
                                  {selectedEmp.recognition_frequency ?? 3}/5
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Strategic Templates drafts manager email */}
                          <div className="space-y-3 border-t border-[var(--c2)] pt-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--c12)]">
                                Retention Draft Assistant
                              </h4>

                              {/* Templates tabs */}
                              <div className="flex items-center bg-[var(--c2)] border border-[var(--c8)] rounded-lg p-0.5">
                                <button
                                  onClick={() => setDraftType("talking_points")}
                                  className={`p-1.5 rounded-md transition-all cursor-pointer ${draftType === "talking_points" ? "bg-[var(--c1)] text-[var(--c16)] shadow-sm font-bold" : "text-[var(--c13)]"
                                    }`}
                                  title={text.talkingPointsTab}
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => setDraftType("retention_email")}
                                  className={`p-1.5 rounded-md transition-all cursor-pointer ${draftType === "retention_email" ? "bg-[var(--c1)] text-[var(--c16)] shadow-sm font-bold" : "text-[var(--c13)]"
                                    }`}
                                  title={text.emailTab}
                                >
                                  <Mail className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Generate button */}
                            {!aiDraft && !loadingDraft ? (
                              <button
                                onClick={generateRetentionDraft}
                                className="w-full bg-[var(--c16)] hover:bg-[var(--c17)] text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                              >
                                <Sparkles className="h-4 w-4 text-[var(--c3)] animate-pulse" />
                                <span>{text.generateBtn}</span>
                              </button>
                            ) : null}

                            {/* Loading draft */}
                            {loadingDraft ? (
                              <div className="p-6 bg-[var(--c1)] border border-[var(--c2)] rounded-xl flex flex-col items-center justify-center text-center space-y-3">
                                <RefreshCw className="h-6 w-6 animate-spin text-[var(--c16)]" />
                                <p className="text-xs text-[var(--c13)] font-semibold animate-pulse">
                                  {draftStatusText}
                                </p>
                              </div>
                            ) : null}

                            {/* Render template */}
                            {aiDraft && !loadingDraft ? (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between text-xs text-[var(--c13)] bg-[var(--c2)]/60 border border-[var(--c4)] px-3 py-1.5 rounded-xl font-mono font-bold">
                                  <span>
                                    {draftType === "talking_points" ? "1-on-1 Guidelines" : "Retention Email"}
                                  </span>
                                  <button
                                    onClick={copyToClipboard}
                                    className="flex items-center gap-1 hover:text-[var(--c16)] transition-all text-[11px] font-sans font-extrabold cursor-pointer text-[var(--c13)]"
                                  >
                                    {copied ? (
                                      <span className="text-emerald-700 flex items-center gap-1 font-black">
                                        <Check className="h-3.5 w-3.5" /> {text.copiedMsg}
                                      </span>
                                    ) : (
                                      <>
                                        <Copy className="h-3.5 w-3.5" />
                                        <span>{text.copy}</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                                <div className="p-4 bg-[var(--c1)] border border-[var(--c2)] rounded-xl max-h-72 overflow-y-auto">
                                  <MarkdownRenderer text={aiDraft} />
                                </div>
                                <button
                                  onClick={generateRetentionDraft}
                                  className="w-full bg-[var(--c2)]/40 hover:bg-[var(--c2)]/80 text-[var(--c16)] font-extrabold text-xs py-2 px-4 border border-[var(--c8)] rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                                >
                                  <RefreshCw className="h-3.5 w-3.5" />
                                  <span>{text.regenerate}</span>
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}

              {/* TAB 2: COMPANY PULSE & RATINGS WORK AREAS (Photo 1 "Company Pulse" + Photo 3 "Highest / Lowest") */}
              {activeTab === "pulse" && (
                <motion.div
                  key="pulse-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Two Columns Grid: Company Pulse Ring Gauge + Highest / Lowest rated Areas */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

                    {/* Left block (5-cols) - Circular "Company Pulse" styled exactly as Photo 1 */}
                    <div className="lg:col-span-5 bg-[var(--c1)] border border-[var(--c5)] rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-6">
                      <div>
                        <h3 className="text-sm font-black text-[var(--c18)] tracking-tight">Company Pulse</h3>
                        <p className="text-[11px] text-[var(--c13)] font-bold">Dynamic workplace retention and climate score mapping</p>
                      </div>

                      {/* Photo 1 replica - Center circle + satellite rating scores */}
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-4">

                        {/* Huge circular dial gauge replica */}
                        <div className="relative flex items-center justify-center select-none shrink-0 h-40 w-40">
                          <svg className="w-full h-full transform -rotate-90">
                            {/* outer background halo */}
                            <circle
                              cx="80"
                              cy="80"
                              r="70"
                              className="stroke-[var(--c2)]"
                              strokeWidth="10"
                              fill="transparent"
                            />
                            {/* colored progress arc */}
                            <circle
                              cx="80"
                              cy="80"
                              r="70"
                              className="stroke-[#52634e]"
                              strokeWidth="10"
                              fill="transparent"
                              strokeDasharray={2 * Math.PI * 70}
                              strokeDashoffset={2 * Math.PI * 70 * (1 - (totalEmployees > 0 ? (100 - avgRisk) : 100) / 100)}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute text-center">
                            <span className="text-4xl font-black text-[var(--c18)] tracking-tighter">
                              {pulseScore}
                            </span>
                            <span className="text-xs text-[var(--c13)] font-extrabold block mt-0.5">/ 10</span>
                          </div>
                        </div>

                        {/* Right side bullet scores list with trend arrows (Photo 1 replica!) */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3 font-semibold text-xs text-[var(--c16)]">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1">
                              <span className="h-2.5 w-2.5 rounded-full bg-emerald-700" />
                              <span className="text-xs font-black">{satisfactionScore}</span>
                              <ArrowUpRight className="h-3 w-3 text-emerald-700" />
                            </div>
                            <span className="text-[10px] text-[var(--c13)] block truncate">Job Satisfaction</span>
                          </div>

                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1">
                              <span className="h-2.5 w-2.5 rounded-full bg-emerald-700" />
                              <span className="text-xs font-black">{balanceScore}</span>
                              <ArrowUpRight className="h-3 w-3 text-emerald-700" />
                            </div>
                            <span className="text-[10px] text-[var(--c13)] block truncate">Work Life Balance</span>
                          </div>

                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1">
                              <span className="h-2.5 w-2.5 rounded-full bg-emerald-700" />
                              <span className="text-xs font-black">{envScore}</span>
                              <ArrowUpRight className="h-3 w-3 text-emerald-700" />
                            </div>
                            <span className="text-[10px] text-[var(--c13)] block truncate">Env Atmosphere</span>
                          </div>

                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1">
                              <span className="h-2.5 w-2.5 rounded-full bg-amber-700" />
                              <span className="text-xs font-black">{promotionScore}</span>
                              <ArrowDownRight className="h-3 w-3 text-amber-700" />
                            </div>
                            <span className="text-[10px] text-[var(--c13)] block truncate">Career Pacing</span>
                          </div>

                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1">
                              <span className="h-2.5 w-2.5 rounded-full bg-emerald-700" />
                              <span className="text-xs font-black">{overtimeScore}</span>
                              <ArrowUpRight className="h-3 w-3 text-emerald-700" />
                            </div>
                            <span className="text-[10px] text-[var(--c13)] block truncate">Overtime Ease</span>
                          </div>

                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1">
                              <span className="h-2.5 w-2.5 rounded-full bg-emerald-700" />
                              <span className="text-xs font-black">{commuteScore}</span>
                              <ArrowUpRight className="h-3 w-3 text-emerald-700" />
                            </div>
                            <span className="text-[10px] text-[var(--c13)] block truncate">Commute Comfort</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-[var(--c2)]/50 border border-[var(--c4)] rounded-2xl text-[10px] text-[var(--c13)] font-semibold flex items-center gap-2">
                        <Info className="h-4.5 w-4.5 shrink-0 text-[var(--c16)]" />
                        <span>Scores calculated dynamically from your organization's data.</span>
                      </div>
                    </div>

                    {/* Right block (7-cols) - Highest & Lowest Rated Work Areas styled exactly as Photo 3 / 9 */}
                    <div className="lg:col-span-7 bg-[var(--c1)] border border-[var(--c5)] rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                      <div>
                        <h3 className="text-sm font-black text-[var(--c18)] tracking-tight">Highest & lowest rated work areas</h3>
                        <p className="text-[11px] text-[var(--c13)] font-bold">Aggregate rating analysis based on standard 1-to-5 metric scales</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">

                        {/* Top rated items side */}
                        <div className="space-y-3.5">
                          <div className="flex items-center gap-1.5 pb-2 border-b border-[var(--c5)]">
                            <ArrowUpRight className="h-5 w-5 text-emerald-700 bg-emerald-50 rounded p-0.5 border border-emerald-200" />
                            <h4 className="text-[11px] font-black uppercase tracking-wider text-emerald-900">Top rated work area statements</h4>
                          </div>

                          <div className="space-y-3">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs font-bold text-[var(--c18)]">
                                <span className="truncate pr-2">R&D Department Culture & Teamwork</span>
                                <span className="text-emerald-800 font-mono">{(Number(envScore) / 2).toFixed(1)}</span>
                              </div>
                              <div className="w-full bg-[var(--c2)] rounded-full h-1.5">
                                <div className="h-1.5 rounded-full bg-emerald-600" style={{ width: `${Number(envScore) * 10}%` }} />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs font-bold text-[var(--c18)]">
                                <span className="truncate pr-2">Professional Training Opportunities</span>
                                <span className="text-emerald-800 font-mono">{(Number(satisfactionScore) / 2).toFixed(1)}</span>
                              </div>
                              <div className="w-full bg-[var(--c2)] rounded-full h-1.5">
                                <div className="h-1.5 rounded-full bg-emerald-600" style={{ width: `${Number(satisfactionScore) * 10}%` }} />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs font-bold text-[var(--c18)]">
                                <span className="truncate pr-2">Commute Proximity & Convenience</span>
                                <span className="text-emerald-800 font-mono">{(Number(commuteScore) / 2).toFixed(1)}</span>
                              </div>
                              <div className="w-full bg-[var(--c2)] rounded-full h-1.5">
                                <div className="h-1.5 rounded-full bg-emerald-600" style={{ width: `${Number(commuteScore) * 10}%` }} />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Lowest rated items side */}
                        <div className="space-y-3.5">
                          <div className="flex items-center gap-1.5 pb-2 border-b border-[var(--c5)]">
                            <ArrowDownRight className="h-5 w-5 text-red-700 bg-red-50 rounded p-0.5 border border-red-200" />
                            <h4 className="text-[11px] font-black uppercase tracking-wider text-red-900">Lowest rated work area statements</h4>
                          </div>

                          <div className="space-y-3">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs font-bold text-[var(--c18)]">
                                <span className="truncate pr-2">Work-Life Integration & Schedules</span>
                                <span className="text-red-800 font-mono">{(Number(balanceScore) / 2).toFixed(1)}</span>
                              </div>
                              <div className="w-full bg-[var(--c2)] rounded-full h-1.5">
                                <div className="h-1.5 rounded-full bg-red-500" style={{ width: `${Number(balanceScore) * 10}%` }} />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs font-bold text-[var(--c18)]">
                                <span className="truncate pr-2">Career Promotion Path Velocity</span>
                                <span className="text-red-800 font-mono">{(Number(promotionScore) / 2).toFixed(1)}</span>
                              </div>
                              <div className="w-full bg-[var(--c2)] rounded-full h-1.5">
                                <div className="h-1.5 rounded-full bg-red-500" style={{ width: `${Number(promotionScore) * 10}%` }} />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs font-bold text-[var(--c18)]">
                                <span className="truncate pr-2">Overtime Pacing & Task Distribution</span>
                                <span className="text-red-800 font-mono">{(Number(overtimeScore) / 2).toFixed(1)}</span>
                              </div>
                              <div className="w-full bg-[var(--c2)] rounded-full h-1.5">
                                <div className="h-1.5 rounded-full bg-red-500" style={{ width: `${Number(overtimeScore) * 10}%` }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setActiveTab("directory")}
                        className="w-full bg-[var(--c16)] hover:bg-[var(--c17)] text-white font-extrabold text-xs py-2 px-4 rounded-xl mt-2 transition-all cursor-pointer"
                      >
                        Inspect Specific Employee Responses
                      </button>
                    </div>
                  </div>

                  {/* Dynamic simulated confidential Exit Survey dialogue list (Photo 7) */}
                  <div className="bg-[var(--c1)] border border-[var(--c5)] rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center justify-between pb-4 border-b border-[var(--c2)] mb-4">
                      <div>
                        <h3 className="text-sm font-black text-[var(--c18)]">Leaver's anonymous feedback notes</h3>
                        <p className="text-[10px] text-[var(--c13)] font-bold">Confidential pulse quotes extracted from periodic check-ins</p>
                      </div>
                      <span className="text-[10px] font-black bg-[var(--c2)] text-[var(--c16)] px-2.5 py-1 rounded-full uppercase tracking-wider">{leaverComments.length} comments logged</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {leaverComments.map((comment, idx) => (
                        <div key={idx} className="bg-[var(--c1)] border border-[var(--c2)] p-4 rounded-2xl space-y-3 flex flex-col justify-between">
                          <div className="flex items-center justify-between text-[10px] font-extrabold text-[var(--c13)]">
                            <span className="bg-[var(--c2)] text-[var(--c16)] px-2 py-0.5 rounded-md">{comment.team}</span>
                            <span className="font-mono">{comment.date}</span>
                          </div>

                          <p className="text-xs text-[var(--c16)] font-medium leading-relaxed italic">
                            “{comment.text}”
                          </p>

                          <div className="flex items-center justify-between border-t border-[var(--c2)] pt-2 mt-1 text-[11px] font-bold">
                            <span className="text-[var(--c13)] font-semibold">{comment.question}</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${comment.sentiment === "Promoter" ? "bg-emerald-50 text-emerald-800" : comment.sentiment === "Passive" ? "bg-amber-50 text-amber-800" : "bg-red-50 text-red-800"
                              }`}>
                              {comment.sentiment}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 3: CUSTOMIZABLE HEAT MAP (Photo 4) */}
              {activeTab === "heatmap" && (
                <motion.div
                  key="heatmap-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-[var(--c1)] border border-[var(--c5)] rounded-3xl p-6 shadow-sm space-y-6"
                >

                  {/* Photo 4 Heatmap controls topbar */}
                  <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-[var(--c2)] pb-5">
                    <div>
                      <h3 className="text-sm font-black text-[var(--c18)]">Likely reasons at-risk employees may leave</h3>
                      <p className="text-[11px] text-[var(--c13)] font-bold">See which factors show up most, grouped by tenure, department, or age.</p>
                    </div>

                    {/* Number / Percentage metric selector toggles (Photo 4 replica) */}
                    <div className="flex items-center gap-2 self-end md:self-center">
                      <div className="flex items-center bg-[var(--c2)] p-0.5 rounded-xl border border-[var(--c8)]">
                        <button
                          onClick={() => setHeatmapMetric("percentage")}
                          className={`px-3 py-1.5 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${heatmapMetric === "percentage" ? "bg-[var(--c1)] text-[var(--c16)] shadow-sm font-bold" : "text-[var(--c13)]"
                            }`}
                        >
                          Percentage
                        </button>
                        <button
                          onClick={() => setHeatmapMetric("number")}
                          className={`px-3 py-1.5 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${heatmapMetric === "number" ? "bg-[var(--c1)] text-[var(--c16)] shadow-sm font-bold" : "text-[var(--c13)]"
                            }`}
                        >
                          Number
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Main Grid Structure layout matching Photo 4: Row Headers, cells with custom opacity backgrounds */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                    {/* Left Demographic filters drawer checklist (Photo 4 sidebar feel) */}
                    <div className="md:col-span-3 space-y-4">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--c11)] px-1 block">Show table by:</span>

                      <div className="space-y-2 text-xs text-[var(--c16)] font-bold">
                        <label className="flex items-center gap-2.5 p-2 bg-[var(--c2)]/50 border border-[var(--c4)] rounded-xl cursor-pointer hover:bg-[var(--c2)]">
                          <input
                            type="radio"
                            name="heatmap-groupby"
                            checked={heatmapGroupBy === "tenure"}
                            onChange={() => setHeatmapGroupBy("tenure")}
                            className="accent-[var(--c16)] h-3.5 w-3.5 cursor-pointer"
                          />
                          <span>Tenure (Length of service)</span>
                        </label>

                        <label className="flex items-center gap-2.5 p-2 bg-[var(--c2)]/50 border border-[var(--c4)] rounded-xl cursor-pointer hover:bg-[var(--c2)]">
                          <input
                            type="radio"
                            name="heatmap-groupby"
                            checked={heatmapGroupBy === "department"}
                            onChange={() => setHeatmapGroupBy("department")}
                            className="accent-[var(--c16)] h-3.5 w-3.5 cursor-pointer"
                          />
                          <span>Department structure</span>
                        </label>

                        <label className="flex items-center gap-2.5 p-2 bg-[var(--c2)]/50 border border-[var(--c4)] rounded-xl cursor-pointer hover:bg-[var(--c2)]">
                          <input
                            type="radio"
                            name="heatmap-groupby"
                            checked={heatmapGroupBy === "age"}
                            onChange={() => setHeatmapGroupBy("age")}
                            className="accent-[var(--c16)] h-3.5 w-3.5 cursor-pointer"
                          />
                          <span>Age demographic group</span>
                        </label>
                      </div>

                      <div className="p-4 bg-[var(--c2)]/40 border border-[var(--c4)] rounded-2xl text-[10px] text-[var(--c13)] leading-relaxed font-semibold">
                        <p className="font-extrabold text-[var(--c16)] mb-1">How to read this table</p>
                        Each cell shows how many <span className="font-extrabold text-[var(--c16)]">at-risk employees</span> (risk score 30% or higher) share a given likely reason, grouped by the option on the left. Darker cells = more employees. These reasons are the AI's <span className="font-extrabold text-[var(--c16)]">top predicted driver</span> for that person — not a self-reported exit reason, since employees haven't left yet.
                      </div>
                    </div>

                    {/* Customizable Heat Map grid replica (Photo 4 replica) */}
                    <div className="md:col-span-9 overflow-x-auto border border-[var(--c5)] rounded-2xl bg-[var(--c1)] shadow-inner">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-[var(--c5)] bg-[var(--c2)]/60 uppercase text-[10px] tracking-wider font-extrabold text-[var(--c15)]">
                            <th className="px-4 py-3.5">Reasons for Leaving</th>
                            {heatmap.columns.map(c => <th key={c} className="px-3 py-3.5 text-center font-bold font-sans">{c}</th>)}
                            <th className="px-4 py-3.5 text-center font-bold bg-[var(--c2)]/80">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--c2)] font-semibold text-[var(--c18)]">
                          {heatmap.rows.map(row => {
                            const rowSum = heatmap.rowTotals[row] || 0;

                            return (
                              <tr key={row} className="hover:bg-[#fcfbf9] transition-all">
                                <td className="px-4 py-2.5 font-bold border-r border-[var(--c2)] text-[var(--c16)] max-w-[200px] truncate">{row}</td>

                                {heatmap.columns.map(col => {
                                  const val = heatmap.counts[row][col] || 0;

                                  // Background opacity intensity calculation
                                  const opacityRatio = maxHeatValue > 0 ? (val / maxHeatValue) : 0;
                                  // Beautiful teal-gradient cell styling exactly like Photo 4
                                  const bgStyle = val > 0 ? {
                                    backgroundColor: `rgba(45, 126, 125, ${Math.min(0.85, opacityRatio * 0.75 + 0.15)})`,
                                    color: opacityRatio > 0.55 ? 'var(--c1)' : 'var(--c18)'
                                  } : undefined;

                                  // Display as percentage or raw count
                                  const displayText = heatmapMetric === "percentage"
                                    ? `${rowSum > 0 ? Math.round((val / rowSum) * 100) : 0}%`
                                    : val;

                                  return (
                                    <td
                                      key={col}
                                      style={bgStyle}
                                      className="px-3 py-2.5 text-center font-mono text-xs border-r border-[var(--c2)]"
                                    >
                                      {displayText}
                                    </td>
                                  );
                                })}

                                {/* Total column */}
                                <td className="px-4 py-2.5 text-center font-mono text-xs font-black bg-[var(--c2)]/35">
                                  {heatmapMetric === "percentage" ? "100%" : rowSum}
                                </td>
                              </tr>
                            );
                          })}

                          {/* Grand summary row */}
                          <tr className="bg-[var(--c2)]/40 font-black">
                            <td className="px-4 py-3 border-r border-[var(--c2)]">Grand Total</td>
                            {heatmap.columns.map(c => {
                              const colSum = heatmap.colTotals[c] || 0;
                              return (
                                <td key={c} className="px-3 py-3 text-center font-mono border-r border-[var(--c2)]">
                                  {heatmapMetric === "percentage" ? `${heatmap.grandTotal > 0 ? Math.round((colSum / heatmap.grandTotal) * 100) : 0}%` : colSum}
                                </td>
                              );
                            })}
                            <td className="px-4 py-3 text-center font-mono text-[var(--c16)]">
                              {heatmapMetric === "percentage" ? "100%" : heatmap.grandTotal}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 5: PROJECT GUIDANCE */}
              {activeTab === "guidance" && (
                <motion.div
                  key="guidance-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-[var(--c1)] border border-[var(--c5)] rounded-3xl p-6 shadow-sm space-y-6 max-w-5xl mx-auto"
                >
                  <div className="border-b border-[var(--c2)] pb-5">
                    <h3 className="text-xl font-black text-[var(--c18)] flex items-center gap-2">
                      <Info className="h-6 w-6 text-[var(--c16)]" />
                      Project Guidance & Feature Overview
                    </h3>
                    <p className="text-xs text-[var(--c13)] font-medium mt-1">
                      Learn how to effectively use the Employee Resignation Risk Predictor to retain your top talent.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Dashboard Overview */}
                    <div className="bg-[var(--c2)]/30 border border-[var(--c5)] p-5 rounded-2xl space-y-3">
                      <h4 className="text-sm font-black text-[var(--c18)] flex items-center gap-2">
                        <Home className="h-4 w-4 text-[var(--c16)]" /> Dashboard Overview
                      </h4>
                      <p className="text-xs text-[var(--c13)] leading-relaxed">
                        This is your mission control. It provides a top-level summary of your workforce. Use it to quickly see the total active employee count, the number of employees at high risk of leaving, and the overall company risk average. It helps executives grasp the immediate health of the organization at a glance.
                      </p>
                    </div>

                    {/* Employee Hub */}
                    <div className="bg-[var(--c2)]/30 border border-[var(--c5)] p-5 rounded-2xl space-y-3">
                      <h4 className="text-sm font-black text-[var(--c18)] flex items-center gap-2">
                        <Users className="h-4 w-4 text-[var(--c16)]" /> Employee Directory Hub
                      </h4>
                      <p className="text-xs text-[var(--c13)] leading-relaxed">
                        Here you can upload new HR datasets (CSV/Excel) and manage your employee list. You can search, filter by risk level (High, Medium, Low), and select an individual employee to view their specific risk factors. You can also generate AI-powered Manager Talking Points or Retention Emails for selected employees.
                      </p>
                    </div>

                    {/* Company Health (Pulse) */}
                    <div className="bg-[var(--c2)]/30 border border-[var(--c5)] p-5 rounded-2xl space-y-3">
                      <h4 className="text-sm font-black text-[var(--c18)] flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-[var(--c16)]" /> Company Health Pulse
                      </h4>
                      <p className="text-xs text-[var(--c13)] leading-relaxed">
                        An aggregated view of how your company is performing across key cultural metrics. The large dial shows your overall pulse score out of 10. Below it, you can identify your organization's top-rated strengths (e.g., Environment, Job Satisfaction) alongside critical areas needing improvement (e.g., Work-Life Balance, Overtime).
                      </p>
                    </div>

                    {/* Turnover Heatmap */}
                    <div className="bg-[var(--c2)]/30 border border-[var(--c5)] p-5 rounded-2xl space-y-3">
                      <h4 className="text-sm font-black text-[var(--c18)] flex items-center gap-2">
                        <Compass className="h-4 w-4 text-[var(--c16)]" /> Turnover Heatmap
                      </h4>
                      <p className="text-xs text-[var(--c13)] leading-relaxed">
                        A powerful diagnostic tool that cross-references employee risk against demographics like Tenure, Department, and Age. The darker the red color, the higher the concentration of at-risk employees in that segment. Use this to pinpoint systemic issues, such as high turnover in the R&D department or among new hires.
                      </p>
                    </div>

                    {/* Compare Employees */}
                    <div className="bg-[var(--c2)]/30 border border-[var(--c5)] p-5 rounded-2xl space-y-3 md:col-span-2">
                      <h4 className="text-sm font-black text-[var(--c18)] flex items-center gap-2">
                        <Users className="h-4 w-4 text-[var(--c16)]" /> Compare Employees
                      </h4>
                      <p className="text-xs text-[var(--c13)] leading-relaxed">
                        Select multiple employees from the dropdown to compare their risk profiles side-by-side. This matrix highlights their risk score, salary, tenure, and other metrics to help HR prioritize who needs immediate intervention. You can also use the <strong>AI Auto-Select</strong> feature to automatically find and compare the most critical employees.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}


            </AnimatePresence>
          </div>
        </main>

        <footer className="max-w-7xl mx-auto px-6 py-10 border-t border-[var(--c7)]/40 text-left text-[var(--c13)] text-[10.5px] space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="space-y-1.5 max-w-xl">
              <p className="font-black text-xs text-[var(--c16)] uppercase tracking-wider">Employee Resignation Risk Predictor (ERRP)</p>
              <p className="leading-relaxed font-medium">
                An advanced decision-support dashboard designed to analyze workplace stress, compensation discrepancies, and job satisfaction. ERRP applies predictive modeling to identify turnover risks and generate actionable, AI-driven employee retention plans.
              </p>
            </div>
            <div className="space-y-1.5 text-left md:text-right shrink-0">
              <p className="font-black text-xs text-[var(--c18)] uppercase tracking-wider">Developer Profile</p>
              <p className="font-bold text-[var(--c18)]">Dalbir Dhaker</p>
              <p className="font-medium text-[var(--c13)]">MCA Candidate • Career Point University, Kota</p>
            </div>
          </div>
          <div className="border-t border-[var(--c7)]/25 pt-4 text-center text-[9px] font-medium leading-relaxed max-w-4xl mx-auto">
            <strong>Confidential Disclaimer:</strong> This system uses predictive analytics and machine learning heuristics to highlight potential resignation risks. Insights are intended as advisory indicators to support human-centric management. Always prioritize direct, empathetic, and open organizational dialogue.
          </div>
        </footer>

        {/* Floating AI Chatbot Assistant */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
          <AnimatePresence>
            {isChatOpen && (
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                className="bg-[var(--c1)] border border-[var(--c5)] shadow-2xl rounded-3xl w-[380px] max-w-[calc(100vw-2rem)] h-[500px] mb-4 flex flex-col overflow-hidden"
              >
                {/* Header */}
                <div className="bg-[var(--c16)] text-white px-5 py-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="h-6 w-6 rounded-md bg-white overflow-hidden flex items-center justify-center border border-slate-100 p-0.5">
                        <img src="/logo.png" alt="Logo" className="h-full w-full object-contain scale-[1.3]" />
                      </div>
                      <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 border border-white" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black tracking-wide">ERRP AI ASSISTANT</h4>
                      <p className="text-[8px] text-white/80 font-bold uppercase tracking-wider">AI Copilot • Online</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {chatMessages.length > 1 && (
                      <button
                        onClick={() => {
                          if (window.confirm("Are you sure you want to clear this chat history?")) {
                            setChatMessages([
                              { role: "model", text: "Hello! I am your AI HR Assistant. You can ask me anything about employee resignation risks, retention strategies, or insights from the loaded employee directory. How can I help you today?" }
                            ]);
                            showToast("Chat history cleared", "success");
                          }
                        }}
                        className="text-white/85 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[10px] font-black uppercase tracking-wider"
                        title="Clear Chat"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Clear</span>
                      </button>
                    )}
                    <button
                      onClick={() => setIsChatOpen(false)}
                      className="text-white/85 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[var(--c2)]/20">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl p-3 text-xs font-medium leading-relaxed shadow-sm ${
                          msg.role === "user"
                            ? "bg-[var(--c16)] text-white rounded-br-none"
                            : "bg-[var(--c1)] text-[var(--c18)] border border-[var(--c5)] rounded-bl-none"
                        }`}
                      >
                        {msg.role === "model" ? (
                          <div>
                            <MarkdownRenderer text={msg.text} />
                            <div className="mt-2 pt-2 border-t border-[var(--c5)]/30 flex items-center justify-end gap-3 text-[9px] text-[var(--c13)] font-bold">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(msg.text);
                                  showToast("Message copied!", "success");
                                }}
                                className="flex items-center gap-1 hover:text-[var(--c16)] transition-all cursor-pointer bg-transparent border-0 p-0"
                                title="Copy response"
                              >
                                <Copy className="h-3 w-3" />
                                <span>COPY</span>
                              </button>
                              <button
                                onClick={() => {
                                  const shareUrl = `${window.location.origin}${window.location.pathname}?chatShare=${encodeURIComponent(msg.text)}`;
                                  navigator.clipboard.writeText(shareUrl);
                                  showToast("Share link copied to clipboard!", "success");
                                }}
                                className="flex items-center gap-1 hover:text-[var(--c16)] transition-all cursor-pointer bg-transparent border-0 p-0"
                                title="Share response"
                              >
                                <Share2 className="h-3 w-3" />
                                <span>SHARE LINK</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          msg.text
                        )}
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-[var(--c1)] text-[var(--c18)] border border-[var(--c5)] rounded-2xl rounded-bl-none p-3 max-w-[80%] text-xs font-medium shadow-sm flex items-center gap-1">
                        <span className="h-1.5 w-1.5 bg-[var(--c13)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="h-1.5 w-1.5 bg-[var(--c13)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="h-1.5 w-1.5 bg-[var(--c13)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Suggestion Chips */}
                {chatMessages.length === 1 && (
                  <div className="px-4 py-2 border-t border-[var(--c5)] bg-[var(--c1)] flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => { setChatInput("Who has the highest resignation risk?"); }}
                      className="text-[9px] font-extrabold text-[var(--c16)] hover:text-white bg-[var(--c2)] hover:bg-[var(--c16)] border border-[var(--c6)] px-2 py-1 rounded-lg transition-all cursor-pointer"
                    >
                      Highest Risk Employees?
                    </button>
                    <button
                      type="button"
                      onClick={() => { setChatInput("Can you suggest some retention strategies for software engineers?"); }}
                      className="text-[9px] font-extrabold text-[var(--c16)] hover:text-white bg-[var(--c2)] hover:bg-[var(--c16)] border border-[var(--c6)] px-2 py-1 rounded-lg transition-all cursor-pointer"
                    >
                      Retention Strategies
                    </button>
                  </div>
                )}

                {/* Footer Form */}
                <form
                  onSubmit={sendChatMessage}
                  className="p-3 border-t border-[var(--c5)] bg-[var(--c1)] flex gap-2"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask anything..."
                    className="flex-1 bg-[var(--c2)] text-[var(--c18)] border border-[var(--c5)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--c16)]"
                  />
                  <button
                    type="submit"
                    className="bg-[var(--c16)] text-white hover:bg-[var(--c17)] p-2 rounded-xl transition-all cursor-pointer shadow-sm"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Bubble Button */}
          <button
            type="button"
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="bg-gradient-to-tr from-[var(--c16)] to-indigo-600 text-white p-4 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer z-50 flex items-center justify-center relative group"
            title="Open AI Chat Assistant"
          >
            <MessageSquare className="h-6 w-6" />
            <span className="absolute right-full mr-3 bg-[var(--c18)] text-white text-[9px] font-black uppercase tracking-wider py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md">
              AI HR Chat Advisor
            </span>
          </button>
        </div>
      </div>


        </>
      )}
    </div>
  );
}

// Built-in fully self-contained Markdown preview renderer for strategic plan drafts
function MarkdownRenderer({ text }: { text: string }) {
  if (!text) return null;

  const lines = text.split("\n");

  return (
    <div className="space-y-2 text-xs leading-relaxed text-[var(--c16)] font-sans font-medium">
      {lines.map((line, i) => {
        const trimmed = line.trim();

        // Headers
        if (trimmed.startsWith("###")) {
          return (
            <h5 key={i} className="text-xs font-black text-[var(--c18)] pt-2 border-b border-[var(--c2)] pb-1 mt-1 uppercase tracking-wide">
              {trimmed.replace(/^###\s*/, "")}
            </h5>
          );
        }
        if (trimmed.startsWith("##")) {
          return (
            <h4 key={i} className="text-xs font-extrabold text-[var(--c18)] pt-3 border-b border-[var(--c2)] pb-1">
              {trimmed.replace(/^##\s*/, "")}
            </h4>
          );
        }
        if (trimmed.startsWith("#")) {
          return (
            <h3 key={i} className="text-sm font-black text-[var(--c18)] pt-4">
              {trimmed.replace(/^#\s*/, "")}
            </h3>
          );
        }

        // Bullet lists
        if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
          const content = trimmed.replace(/^[\*\-]\s*/, "");
          return (
            <div key={i} className="flex items-start gap-2 pl-1">
              <span className="text-[var(--c16)] mt-1.5 h-1 w-1 rounded-full bg-[var(--c16)] shrink-0" />
              <span>{renderBoldText(content)}</span>
            </div>
          );
        }

        // Empty lines spacing
        if (trimmed === "") {
          return <div key={i} className="h-1" />;
        }

        // Default paragraph body
        return <p key={i}>{renderBoldText(trimmed)}</p>;
      })}
    </div>
  );
}

// Safe parsing helper for bold keywords
function renderBoldText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-extrabold text-[var(--c18)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}
