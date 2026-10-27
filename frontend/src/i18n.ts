import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      appName: "AICTE Complaint Intelligence Hub",
      tagline: "One institution, one complaint view, across every bureau and cell",
      portalTitle: "All India Council for Technical Education",
      subTitle: "Statutory Body Under Ministry of Education, Govt. of India",
      nav: {
        home: "Home",
        studentPortal: "Student Portal",
        workspace: "Official Workspace",
        institution360: "Institution 360",
        analyticsStudio: "Visual Analytics Studio",
        networkMap: "Case Network Intelligence",
        rootCause: "Root-Cause Dashboard",
        settings: "Settings & Audit",
        logout: "Logout",
        demoScript: "Demo Guide"
      },
      roles: {
        student: "Student",
        official: "Official",
        admin: "Admin / Leadership"
      },
      login: {
        title: "Official & Student Single Sign-On",
        welcomeBack: "Access AICTE Centralized Complaint Intelligence Hub",
        mobilePlaceholder: "Enter 10-digit Mobile Number",
        sendOtp: "Send OTP",
        otpPlaceholder: "Enter 6-digit OTP",
        emailPlaceholder: "Official Government Email",
        passwordPlaceholder: "Password",
        fillDemo: "Fill Demo Credentials",
        demoModeBanner: "1-Click Demo Personas (Select to login instantly):",
        signIn: "Sign In to CIH",
        mockOtpHint: "Demo OTP is: 123456"
      },
      student: {
        fileComplaint: "File a Complaint",
        trackStatus: "Track Complaint Status",
        voiceAssistance: "Voice Assistance Mode",
        cameraEvidence: "Camera & OCR Capture",
        anonymousToggle: "Submit as Anonymous Complaint",
        selectInstitution: "Select or Search Institution",
        institutionPlaceholder: "Type college name, AICTE ID, or city...",
        issuePlaceholder: "Describe the grievance in detail. You can type or use the microphone in your preferred language...",
        uploadDoc: "Upload Documents / Photos",
        takePhoto: "Open Camera",
        extractOcr: "Extract Text via OCR",
        submitComplaint: "Submit Complaint to AICTE",
        triageTitle: "Live AI Triage & Routing Confirmation",
        expectedResolution: "Expected Resolution Date",
        routedTo: "Routed Bureau",
        category: "Classified Category",
        caseGroup: "Clustered Case Group",
        feedbackTitle: "Complaint Closure Feedback",
        rateExperience: "Rate your grievance redressal experience"
      },
      official: {
        searchPlaceholder: "Search complaints in plain English or Hindi (e.g. 'overdue fee complaints in Madhya Pradesh')...",
        inboxTitle: "Grievance Redressal Inbox",
        allBureaus: "All Bureaus",
        allCategories: "All Categories",
        allStatuses: "All Statuses",
        overdueOnly: "Overdue Only (SLA Breached)",
        aiSummary: "AI Complaint Summary",
        sourceHighlightNote: "Click any field to highlight the exact source sentence in the original complaint",
        mainIssue: "Main Issue",
        institutionInvolved: "Institution Involved",
        importantDates: "Important Dates",
        actionsTaken: "Actions Already Taken",
        outstandingInfo: "Outstanding Information",
        nextStep: "Recommended Next Step",
        markVerified: "Mark as Verified",
        regenerate: "Regenerate AI Summary",
        conflictAlerts: "Cross-Bureau Conflict Alerts",
        takeAction: "Record Official Action",
        referBureau: "Refer to Another Bureau",
        changeStatus: "Change Status",
        exportReport: "Export Report"
      },
      actions: {
        showCause: "Issue Show-Cause Notice",
        inspection: "Request Surprise Inspection",
        penalty: "Impose Monetary Penalty",
        resolve: "Mark Resolved",
        close: "Close Case"
      }
    }
  },
  hi: {
    translation: {
      appName: "एआईसीटीई शिकायत इंटेलिजेंस हब",
      tagline: "एक संस्थान, एक शिकायत दृश्य - प्रत्येक ब्यूरो और सेल में",
      portalTitle: "अखिल भारतीय तकनीकी शिक्षा परिषद",
      subTitle: "शिक्षा मंत्रालय, भारत सरकार के अधीन सांविधिक निकाय",
      nav: {
        home: "होम",
        studentPortal: "छात्र पोर्टल",
        workspace: "अधिकारी कार्यक्षेत्र",
        institution360: "संस्थान 360",
        analyticsStudio: "एनालिटिक्स स्टूडियो",
        networkMap: "नेटवर्क इंटेलिजेंस",
        rootCause: "मूल-कारण डैशबोर्ड",
        settings: "सेटिंग्स और ऑडिट",
        logout: "लॉगआउट",
        demoScript: "डेमो गाइड"
      },
      roles: {
        student: "छात्र",
        official: "अधिकारी",
        admin: "प्रशासन / नेतृत्व"
      },
      login: {
        title: "अधिकारी एवं छात्र एकल लॉगिन",
        welcomeBack: "एआईसीटीई केंद्रीकृत शिकायत प्रणाली में प्रवेश करें",
        mobilePlaceholder: "10 अंकों का मोबाइल नंबर दर्ज करें",
        sendOtp: "ओटीपी भेजें",
        otpPlaceholder: "6 अंकों का ओटीपी दर्ज करें",
        emailPlaceholder: "आधिकारिक सरकारी ईमेल",
        passwordPlaceholder: "पासवर्ड",
        fillDemo: "डेमो क्रेडेंशियल भरें",
        demoModeBanner: "1-क्लिक डेमो प्रोफाइल (तुरंत लॉगिन करें):",
        signIn: "सीआईएच में प्रवेश करें",
        mockOtpHint: "डेमो ओटीपी है: 123456"
      },
      student: {
        fileComplaint: "शिकायत दर्ज करें",
        trackStatus: "शिकायत की स्थिति जांचें",
        voiceAssistance: "ध्वनि सहायता मोड",
        cameraEvidence: "कैमरा एवं ओसीआर साक्ष्य",
        anonymousToggle: "गुमनाम शिकायत के रूप में दर्ज करें",
        selectInstitution: "संस्थान चुनें या खोजें",
        institutionPlaceholder: "कॉलेज का नाम, एआईसीटीई आईडी या शहर लिखें...",
        issuePlaceholder: "शिकायत का विवरण लिखें या माइक से बोलें...",
        uploadDoc: "दस्तावेज़ / फोटो अपलोड करें",
        takePhoto: "कैमरा खोलें",
        extractOcr: "ओसीआर द्वारा पाठ निकालें",
        submitComplaint: "शिकायत दर्ज करें",
        triageTitle: "एआई ट्राइएज एवं रूटिंग पुष्टि",
        expectedResolution: "अपेक्षित समाधान तिथि",
        routedTo: "प्रेषित ब्यूरो",
        category: "वर्गीकृत श्रेणी",
        caseGroup: "संबंधित केस समूह",
        feedbackTitle: "शिकायत समाधान फीडबैक",
        rateExperience: "अपने अनुभव का मूल्यांकन करें"
      },
      official: {
        searchPlaceholder: "प्राकृतिक भाषा में खोजें (उदा: 'मध्य प्रदेश में लंबित फीस संबंधी शिकायतें')...",
        inboxTitle: "शिकायत निवारण इनबॉक्स",
        allBureaus: "सभी ब्यूरो",
        allCategories: "सभी श्रेणियां",
        allStatuses: "सभी स्थितियां",
        overdueOnly: "केवल समय-सीमा पार (एसएलए उल्लंघन)",
        aiSummary: "एआई शिकायत सारांश",
        sourceHighlightNote: "मूल शिकायत में स्रोत वाक्य को हाइलाइट करने के लिए किसी भी फ़ील्ड पर क्लिक करें",
        mainIssue: "मुख्य समस्या",
        institutionInvolved: "संबंधित संस्थान",
        importantDates: "महत्वपूर्ण तिथियां",
        actionsTaken: "की गई कार्रवाई",
        outstandingInfo: "लंबित जानकारी",
        nextStep: "अनुशंसित अगला कदम",
        markVerified: "सत्यापित चिह्नित करें",
        regenerate: "पुनः सारांश बनाएं",
        conflictAlerts: "क्रॉस-ब्यूरो टकराव अलर्ट",
        takeAction: "आधिकारिक कार्रवाई दर्ज करें",
        referBureau: "अन्य ब्यूरो को संदर्भित करें",
        changeStatus: "स्थिति बदलें",
        exportReport: "रिपोर्ट डाउनलोड करें"
      },
      actions: {
        showCause: "कारण बताओ नोटिस जारी करें",
        inspection: "निरीक्षण का अनुरोध करें",
        penalty: "जुर्माना लगाएं",
        resolve: "समाधान चिह्नित करें",
        close: "केस बंद करें"
      }
    }
  },
  mr: {
    translation: {
      appName: "एआयसीटीई तक्रार इंटेलिजेंस हब",
      tagline: "एक संस्था, एक तक्रार दृश्य - सर्व ब्युरो आणि कक्षांमध्ये",
      portalTitle: "अखिल भारतीय तंत्रशिक्षण परिषद",
      subTitle: "शिक्षण मंत्रालय, भारत सरकार अंतर्गत वैधानिक संस्था",
      nav: {
        home: "मुख्यपृष्ठ",
        studentPortal: "विद्यार्थी पोर्टल",
        workspace: "अधिकारी कार्यक्षेत्र",
        institution360: "संस्था 360",
        analyticsStudio: "विश्लेषण स्टुडिओ",
        networkMap: "नेटवर्क इंटेलिजेंस",
        rootCause: "मूळ-कारण डॅशबोर्ड",
        settings: "सेटिंग्ज आणि ऑडिट",
        logout: "बाहेर पडा",
        demoScript: "डेमो मार्गदर्शक"
      },
      roles: {
        student: "विद्यार्थी",
        official: "अधिकारी",
        admin: "प्रशासन / नेतृत्व"
      },
      login: {
        title: "अधिकारी व विद्यार्थी लॉगिन",
        welcomeBack: "एआयसीटीई तक्रार इंटेलिजेंस हबमध्ये प्रवेश करा",
        mobilePlaceholder: "10 अंकी मोबाईल क्रमांक टाका",
        sendOtp: "ओटीपी पाठवा",
        otpPlaceholder: "6 अंकी ओटीपी टाका",
        emailPlaceholder: "सरकारी ईमेल",
        passwordPlaceholder: "पासवर्ड",
        fillDemo: "डेमो क्रेडेंशियल भरा",
        demoModeBanner: "1-क्लिक डेमो प्रोफाईल:",
        signIn: "लॉगिन करा",
        mockOtpHint: "डेमो ओटीपी आहे: 123456"
      },
      student: {
        fileComplaint: "तक्रार दाखल करा",
        trackStatus: "तक्रारीची स्थिती तपासा",
        voiceAssistance: "व्हॉइस असिस्टंट मोड",
        cameraEvidence: "कॅमेरा आणि ओसीआर पुरावा",
        anonymousToggle: "निनावी तक्रार नोंदवा",
        selectInstitution: "संस्था शोधा",
        institutionPlaceholder: "महाविद्यालयाचे नाव किंवा शहर शोधा...",
        issuePlaceholder: "तक्रार सविस्तर लिहा किंवा बोलून सांगा...",
        uploadDoc: "कागदपत्रे अपलोड करा",
        takePhoto: "कॅमेरा उघडा",
        extractOcr: "ओसीआर मजकूर काढा",
        submitComplaint: "तक्रार सादर करा",
        triageTitle: "एआय ट्राइएज आणि राउटिंग खात्री",
        expectedResolution: "अपेक्षित निकाल तारीख",
        routedTo: "नेमलेला ब्युरो",
        category: "तक्रार वर्गवारी",
        caseGroup: "संबंधित गट",
        feedbackTitle: "अभिप्राय नोंदवा",
        rateExperience: "आपला अनुभव रेट करा"
      },
      official: {
        searchPlaceholder: "तक्रारी शोधा...",
        inboxTitle: "तक्रार निवारण इनबॉक्स",
        allBureaus: "सर्व ब्युरो",
        allCategories: "सर्व वर्गवारी",
        allStatuses: "सर्व स्थिती",
        overdueOnly: "केवळ मुदत संपलेल्या",
        aiSummary: "एआय तक्रार सारांश",
        sourceHighlightNote: "मूळ मजकुरात पाहण्यासाठी क्लिक करा",
        mainIssue: "मुख्य मुद्दा",
        institutionInvolved: "संबंधित संस्था",
        importantDates: "महत्त्वाच्या तारखा",
        actionsTaken: "केलेली कारवाई",
        outstandingInfo: "प्रलंबित माहिती",
        nextStep: "पुढील शिफारस",
        markVerified: "सत्यापित करा",
        regenerate: "पुन्हा तयार करा",
        conflictAlerts: "संघर्ष सूचना",
        takeAction: "कारवाई नोंदवा",
        referBureau: "इतर ब्युरोकडे वर्ग करा",
        changeStatus: "स्थिती बदला",
        exportReport: "अहवाल डाउनलोड करा"
      },
      actions: {
        showCause: "कारणे दाखवा नोटीस",
        inspection: "तपासणी विनंती",
        penalty: "दंड आकारणी",
        resolve: "निवारण झाले",
        close: "प्रकरण बंद"
      }
    }
  },
  bn: {
    translation: {
      appName: "এআইসিটিই অভিযোগ ইন্টেলিজেন্স হাব",
      tagline: "একটি প্রতিষ্ঠান, একটি অভিযোগ দর্শন - প্রতিটি ব্যুরো জুড়ে",
      portalTitle: "অল ইন্ডিয়া কাউন্সিল ফর টেকনিক্যাল এডুকেশন",
      subTitle: "শিক্ষা মন্ত্রক, ভারত সরকার",
      nav: {
        home: "হোম",
        studentPortal: "ছাত্র পোর্টাল",
        workspace: "অফিসিয়াল ওয়ার্কস্পেস",
        institution360: "প্রতিষ্ঠান ৩৬০",
        analyticsStudio: "অ্যানালিটিক্স স্টুডিও",
        networkMap: "নেটওয়ার্ক ইন্টেলিজেন্স",
        rootCause: "মূল-কারণ ড্যাশবোর্ড",
        settings: "সেটিংস ও অডিট",
        logout: "লগআউট",
        demoScript: "ডেমো গাইড"
      },
      roles: {
        student: "ছাত্র",
        official: "অফিসার",
        admin: "নেতৃত্ব"
      },
      login: {
        title: "একক সাইন-ইন পোর্টাল",
        welcomeBack: "এআইসিটিই পোর্টালে স্বাগতম",
        mobilePlaceholder: "১০ অঙ্কের মোবাইল নম্বর",
        sendOtp: "ওটিপি পাঠান",
        otpPlaceholder: "৬ অঙ্কের ওটিপি",
        emailPlaceholder: "অফিসিয়াল ইমেল",
        passwordPlaceholder: "পাসওয়ার্ড",
        fillDemo: "ডেমো তথ্য পূরণ করুন",
        demoModeBanner: "১-ক্লিক ডেমো প্রোফাইল:",
        signIn: "প্রবেশ করুন",
        mockOtpHint: "ডেমো ওটিপি: 123456"
      },
      student: {
        fileComplaint: "অভিযোগ দায়ের করুন",
        trackStatus: "অবস্থা পর্যবেক্ষণ করুন",
        voiceAssistance: "ভয়েস সহায়তা মোড",
        cameraEvidence: "ক্যামেরা ও ওসিআর",
        anonymousToggle: "বেনামী অভিযোগ",
        selectInstitution: "প্রতিষ্ঠান নির্বাচন করুন",
        institutionPlaceholder: "কলেজের নাম বা এআইসিটিই আইডি লিখুন...",
        issuePlaceholder: "অভিযোগের বিবরণ লিখুন বা ভয়েস ব্যবহার করুন...",
        uploadDoc: "নথি আপলোড করুন",
        takePhoto: "ক্যামেরা খুলুন",
        extractOcr: "ওসিআর টেক্সট বের করুন",
        submitComplaint: "অভিযোগ জমা দিন",
        triageTitle: "লাইভ এআই ট্রায়াজ নিশ্চিতকরণ",
        expectedResolution: "সম্ভাব্য সমাধানের তারিখ",
        routedTo: "প্রেরিত ব্যুরো",
        category: "শ্রেণী",
        caseGroup: "কেস গ্রুপ",
        feedbackTitle: "মতামত দিন",
        rateExperience: "অভিজ্ঞতা মূল্যায়ন করুন"
      },
      official: {
        searchPlaceholder: "অভিযোগ খুঁজুন...",
        inboxTitle: "অভিযোগ ইনবক্স",
        allBureaus: "সমস্ত ব্যুরো",
        allCategories: "সমস্ত বিভাগ",
        allStatuses: "সমস্ত অবস্থা",
        overdueOnly: "মেয়াদোত্তীর্ণ",
        aiSummary: "এআই সারসংক্ষেপ",
        sourceHighlightNote: "উৎস বাক্য দেখতে ক্লিক করুন",
        mainIssue: "মূল সমস্যা",
        institutionInvolved: "জড়িত প্রতিষ্ঠান",
        importantDates: "গুরুত্বপূর্ণ তারিখ",
        actionsTaken: "গৃহীত পদক্ষেপ",
        outstandingInfo: "বকেয়া তথ্য",
        nextStep: "সুপারিশকৃত পদক্ষেপ",
        markVerified: "যাচাইকৃত চিহ্নিত করুন",
        regenerate: "পুনরায় তৈরি করুন",
        conflictAlerts: "বিরোধের সতর্কতা",
        takeAction: "পদক্ষেপ রেকর্ড করুন",
        referBureau: "অন্য ব্যুরোতে পাঠান",
        changeStatus: "অবস্থা পরিবর্তন করুন",
        exportReport: "রিপোর্ট ডাউনলোড করুন"
      },
      actions: {
        showCause: "শোকজ নোটিশ",
        inspection: "পরিদর্শন অনুরোধ",
        penalty: "জরিমানা আরোপ",
        resolve: "সমাধান হয়েছে",
        close: "কেস বন্ধ"
      }
    }
  },
  ta: {
    translation: {
      appName: "ஏஐசிடிஇ புகார் நுண்ணறிவு மையம்",
      tagline: "ஒரு நிறுவனம், ஒரு புகார் பார்வை - அனைத்து துறைகளிலும்",
      portalTitle: "அகில இந்திய தொழில்நுட்பக் கல்விக் குழு",
      subTitle: "கல்வி அமைச்சகம், இந்திய அரசு",
      nav: {
        home: "முகப்பு",
        studentPortal: "மாணவர் தளம்",
        workspace: "அதிகாரிகள் பணிப்பகுதி",
        institution360: "நிறுவனம் 360",
        analyticsStudio: "பகுப்பாய்வு கூடம்",
        networkMap: "நெட்வொர்க் வரைபடம்",
        rootCause: "மூல-காரண பலகை",
        settings: "அமைப்புகள் & தணிக்கை",
        logout: "வெளியேறு",
        demoScript: "டெமோ வழிகாட்டி"
      },
      roles: {
        student: "மாணவர்",
        official: "அதிகாரி",
        admin: "நிர்வாகம்"
      },
      login: {
        title: "ஒற்றை உள்நுழைவு தளம்",
        welcomeBack: "ஏஐசிடிஇ தளத்திற்கு வருக",
        mobilePlaceholder: "10 இலக்க மொபைல் எண்",
        sendOtp: "OTP அனுப்புக",
        otpPlaceholder: "6 இலக்க OTP",
        emailPlaceholder: "அரசு மின்னஞ்சல்",
        passwordPlaceholder: "கடவுச்சொல்",
        fillDemo: "டெமோ விவரங்களை நிரப்பு",
        demoModeBanner: "1-கிளிக் டெமோ சுயவிவரங்கள்:",
        signIn: "உள்நுழைக",
        mockOtpHint: "டெமோ OTP: 123456"
      },
      student: {
        fileComplaint: "புகார் பதிவு செய்க",
        trackStatus: "புகார் நிலை கண்காணிக்க",
        voiceAssistance: "குரல் உதவி முறை",
        cameraEvidence: "கேமரா & OCR ஆதாரம்",
        anonymousToggle: "பெயரற்ற புகார்",
        selectInstitution: "நிறுவனத்தைத் தேர்ந்தெடுக்கவும்",
        institutionPlaceholder: "கல்லூரி பெயர் அல்லது குறியீடு...",
        issuePlaceholder: "புகாரை உள்ளிடவும் அல்லது குரல் மூலம் கூறவும்...",
        uploadDoc: "ஆவணங்கள் பதிவேற்றுக",
        takePhoto: "கேமரா திறக்க",
        extractOcr: "OCR மூலம் உரையைப் பிரித்தெடுக்க",
        submitComplaint: "புகாரை சமர்ப்பிக்கவும்",
        triageTitle: "நேரலை AI மதிப்பாய்வு உறுதிப்படுத்தல்",
        expectedResolution: "எதிர்பார்க்கப்படும் தீர்வு தேதி",
        routedTo: "ஒதுக்கப்பட்ட துறை",
        category: "வகை",
        caseGroup: "வழக்கு குழு",
        feedbackTitle: "கருத்து தெரிவிக்க",
        rateExperience: "மதிப்பீடு செய்க"
      },
      official: {
        searchPlaceholder: "புகார்களைத் தேடுக...",
        inboxTitle: "புகார் தீர்வு இன்பாக்ஸ்",
        allBureaus: "அனைத்து துறைகள்",
        allCategories: "அனைத்து வகைகள்",
        allStatuses: "அனைத்து நிலைகள்",
        overdueOnly: "காலாவதியானவை மட்டும்",
        aiSummary: "AI சுருக்கம்",
        sourceHighlightNote: "மூல வாக்கியத்தைக் காண கிளிக் செய்க",
        mainIssue: "முக்கிய பிரச்சனை",
        institutionInvolved: "தொடர்புடைய நிறுவனம்",
        importantDates: "முக்கிய தேதிகள்",
        actionsTaken: "எடுக்கப்பட்ட நடவடிக்கை",
        outstandingInfo: "நிலுவையில் உள்ள தகவல்",
        nextStep: "பரிந்துரைக்கப்படும் நடவடிக்கை",
        markVerified: "சரிபார்க்கப்பட்டது என குறிக்கவும்",
        regenerate: "மீண்டும் உருவாக்குக",
        conflictAlerts: "முரண்பாட்டு எச்சரிக்கைகள்",
        takeAction: "நடவடிக்கை எடுக்க",
        referBureau: "வேறு துறைக்கு மாற்றுக",
        changeStatus: "நிலையை மாற்றுக",
        exportReport: "அறிக்கையைப் பதிவிறக்குக"
      },
      actions: {
        showCause: "விளக்கம் கேட்கும் அறிவிப்பு",
        inspection: "ஆய்வு கோரிக்கை",
        penalty: "அபராதம் விதிக்க",
        resolve: "தீர்வு காணப்பட்டது",
        close: "வழக்கு முடிக்கப்பட்டது"
      }
    }
  },
  te: {
    translation: {
      appName: "ఏఐసీటీఈ ఫిర్యాదు ఇంటెలిజెన్స్ హబ్",
      tagline: "ఒకే సంస్థ, ఒకే ఫిర్యాదు దృశ్యం - ప్రతి బ్యూరో పరిధిలో",
      portalTitle: "అఖిల భారత సాంకేతిక విద్యా మండలి",
      subTitle: "విద్యా మంత్రిత్వ శాఖ, భారత ప్రభుత్వం",
      nav: {
        home: "హోమ్",
        studentPortal: "విద్యార్థి పోర్టల్",
        workspace: "అధికారుల కార్యక్షేత్రం",
        institution360: "సంస్థ 360",
        analyticsStudio: "విశ్లేషణల స్టూడియో",
        networkMap: "నెట్‌వర్క్ ఇంటెలిజెన్స్",
        rootCause: "మూల-కారణ డాష్‌బోర్డ్",
        settings: "సెట్టింగ్‌లు & ఆడిట్",
        logout: "లాగౌట్",
        demoScript: "డెమో గైడ్"
      },
      roles: {
        student: "విద్యార్థి",
        official: "అధికారి",
        admin: "నాయకత్వం"
      },
      login: {
        title: "సింగిల్ సైన్-ఆన్ పోర్టల్",
        welcomeBack: "ఏఐసీటీఈ వ్యవస్థకు స్వాగతం",
        mobilePlaceholder: "10 అంకెల మొబైల్ నంబర్",
        sendOtp: "OTP పంపండి",
        otpPlaceholder: "6 అంకెల OTP",
        emailPlaceholder: "ప్రభుత్వ ఇమెయిల్",
        passwordPlaceholder: "పాస్‌వర్డ్",
        fillDemo: "డెమో వివరాలు నింపండి",
        demoModeBanner: "1-క్లిక్ డెమో ప్రొఫైల్స్:",
        signIn: "లాగిన్ అవ్వండి",
        mockOtpHint: "డెమో OTP: 123456"
      },
      student: {
        fileComplaint: "ఫిర్యాదు దాఖలు చేయండి",
        trackStatus: "స్థితిని ట్రాక్ చేయండి",
        voiceAssistance: "వాయిస్ సహాయం మోడ్",
        cameraEvidence: "కెమెరా & OCR సాక్ష్యం",
        anonymousToggle: "అనామక ఫిర్యాదు",
        selectInstitution: "సంస్థను ఎంచుకోండి",
        institutionPlaceholder: "కళాశాల పేరు లేదా ఐడీ...",
        issuePlaceholder: "ఫిర్యాదును వివరించండి లేదా వాయిస్ వాడండి...",
        uploadDoc: "పత్రాలు అప్‌లోడ్ చేయండి",
        takePhoto: "కెమెరా తెరవండి",
        extractOcr: "OCR టెక్స్ట్ తీయండి",
        submitComplaint: "సమర్పించండి",
        triageTitle: "లైవ్ AI ట్రియాజ్ నిర్ధారణ",
        expectedResolution: "పరిష్కార తేదీ",
        routedTo: "బ్యూరో",
        category: "వర్గం",
        caseGroup: "కేస్ గ్రూప్",
        feedbackTitle: "ఫీడ్‌బ్యాక్ ఇవ్వండి",
        rateExperience: "రేటింగ్ చేయండి"
      },
      official: {
        searchPlaceholder: "ఫిర్యాదులను వెతకండి...",
        inboxTitle: "ఫిర్యాదుల ఇన్‌బాక్స్",
        allBureaus: "అన్ని బ్యూరోలు",
        allCategories: "అన్ని వర్గాలు",
        allStatuses: "అన్ని స్థితులు",
        overdueOnly: "గడువు ముగిసినవి",
        aiSummary: "AI సారాంశం",
        sourceHighlightNote: "మూల వాక్యాన్ని చూడటానికి క్లిక్ చేయండి",
        mainIssue: "ప్రధాన సమస్య",
        institutionInvolved: "సంబంధిత సంస్థ",
        importantDates: "ముఖ్యమైన తేదీలు",
        actionsTaken: "తీసుకున్న చర్యలు",
        outstandingInfo: "మిగిలిన సమాచారం",
        nextStep: "సిఫార్సు చేసిన తదుపరి చర్య",
        markVerified: "ధృవీకరించబడినట్లు గుర్తించండి",
        regenerate: "మళ్లీ రూపొందించండి",
        conflictAlerts: "సంఘర్షణ హెచ్చరికలు",
        takeAction: "చర్య నమోదు చేయండి",
        referBureau: "మరొక బ్యూరోకి బదిలీ చేయండి",
        changeStatus: "స్థితి మార్చండి",
        exportReport: "నివేదిక డౌన్‌లోడ్"
      },
      actions: {
        showCause: "షోకాజ్ నోటీసు",
        inspection: "తనిఖీ అభ్యర్థన",
        penalty: "జరిమానా విధించండి",
        resolve: "పరిష్కరించబడింది",
        close: "కేసు మూసివేత"
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
