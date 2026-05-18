'use client';

import { useState, useEffect, useRef } from 'react';
import { ActionIcon, Paper, Text, TextInput, ScrollArea, Button, Group, Avatar, Badge, Box } from '@mantine/core';
import { IconRobot, IconSend, IconX, IconTrash, IconSparkles } from '@tabler/icons-react';

const localizedData = {
  en: {
    title: "Flega AI Assistant",
    subtitle: "24/7 Virtual Support",
    online: "Online",
    placeholder: "Ask something about the website...",
    welcome: "Hello! I am your Flega AI Assistant. How can I help you recover your lost items, missing persons, or vehicles today?",
    clearHistory: "Clear chat",
    chips: [
      { text: "How do I report a missing case?", value: "reporting" },
      { text: "How does AI camera detection work?", value: "cameras" },
      { text: "Is case registration free?", value: "pricing" },
      { text: "What else can this platform do?", value: "help" }
    ],
    responses: {
      reporting: "To report a missing case, follow these detailed steps:\n\n1. Go to your dashboard and click 'Report Missing'.\n2. Select Case Type (Missing Person, Missing Vehicle, or Special Case).\n3. Fill in basic traits (names, plate numbers, colors, gender, age, height).\n4. Select 'Last Known Location' on the interactive map.\n5. Upload recent clear photos (minimum 2 files required).\n6. For special categories (e.g. mentally ill), upload mandatory files like a doctor's report.\n7. Review all sections and click 'Submit Report'.",
      cameras: "Our 24/7 AI-powered matching operates through these steps:\n\n1. Cameras scan public spaces and CCTV feeds in real time.\n2. The AI Matcher extracts facial features and license plate patterns.\n3. The engine cross-references sightings against our database of active cases.\n4. When a verified match is found, notifications are immediately sent.\n5. You receive alerts with exact map coordinates via In-App message, Email, or Telegram bot!",
      pricing: "Our pricing structure and registration plans work as follows:\n\n1. **Free Account**: You get 1 active report for free. This includes basic map matching and in-app alerts.\n2. **Premium Upgrade**: Starting at 360 birr/month (processed securely via Chapa), supporting:\n   - Unlimited reports filed.\n   - Priority AI facial/license plate search.\n   - Real-time SMS and Telegram bot alerts.\n   - Live GPS tracking for smart belts.",
      help: "Here is how you can utilize the platform's key features:\n\n1. **Monitor Alerts**: Search missing people or stolen cars on public listing directories.\n2. **Submit Sightings**: Help the community by pinning sightings on the interactive map.\n3. **Track Devices**: Pair smart GPS belts under your profile to track kids/elderly.\n4. **Receive Notifications**: Connect your Telegram account for instant real-time alerts.",
      fallback: "I'm not sure about that. Here are the steps to get more support:\n\n1. Go to the Settings page and select 'Give Feedback'.\n2. Submit your question or report a bug directly to our developers.\n3. Contact our support team directly at contact@flega.com for advanced help."
    },
    keywords: {
      reporting: ["report", "missing", "create", "register", "submit", "lost", "add"],
      cameras: ["camera", "cctv", "detection", "ai", "matching", "plate", "face", "scan"],
      pricing: ["free", "pricing", "price", "subscription", "premium", "chapa", "birr", "pay", "cost"],
      help: ["help", "use", "works", "what", "how", "guide", "info"]
    }
  },
  am: {
    title: "የፍለጋ AI ረዳት",
    subtitle: "24/7 እገዛ",
    online: "ኦንላይን",
    placeholder: "ስለ ድረገጹ ጥያቄ ይጠይቁ...",
    welcome: "ሰላም! እኔ የፍለጋ AI ረዳትዎ ነኝ። ዛሬ የጠፉ ሰዎችን ወይም ተሽከርካሪዎችን እንዴት እንድታገኝ ልረዳህ እችላለሁ?",
    clearHistory: "ውይይት አጽዳ",
    chips: [
      { text: "ሪፖርት እንዴት አደርጋለሁ?", value: "reporting" },
      { text: "የካሜራ አሰሳ እንዴት ይሰራል?", value: "cameras" },
      { text: "ምዝገባው ነፃ ነው?", value: "pricing" },
      { text: "ሌላ ምን መስራት እችላለሁ?", value: "help" }
    ],
    responses: {
      reporting: "የጠፋ ሰውን ወይም ተሽከርካሪን ሪፖርት ለማድረግ እነዚህን ደረጃዎች ይከተሉ፡\n\n1. ወደ ዳሽቦርድዎ በመሄድ 'ሪፖርት ያድርጉ' የሚለውን ይጫኑ።\n2. የጉዳይ አይነት ይምረጡ (የጠፋ ሰው፣ የጠፋ ተሽከርካሪ፣ ወይም ልዩ ሁኔታ)።\n3. መሰረታዊ መለያዎችን ይሙሉ (ስሞች፣ የሰሌዳ ቁጥሮች፣ ጾታ፣ ዕድሜ፣ ቁመት)።\n4. በይነተገናኝ በሆነው ካርታችን ላይ መጨረሻ የታየበትን ቦታ ይምረጡ።\n5. ግልጽ የሆኑ ፎቶዎችን ይስቀሉ (ቢያንስ 2 ፋይሎች ያስፈልጋሉ)።\n6. ለልዩ ምድብ (ለምሳሌ የአዕምሮ ህመም) የሀኪም ምስክር ወረቀት ይስቀሉ፤\n7. መረጃውን በሙሉ ከገመገሙ በኋላ 'ሪፖርት አስገባ' የሚለውን ይጫኑ።",
      cameras: "የእኛ 24/7 AI-ተኮር የካሜራ አሰሳ በእነዚህ ሂደቶች ይሰራል፡\n\n1. ካሜራዎች የህዝብ ቦታዎችን እና የደህንነት ካሜራዎችን በቀጥታ ያሳልፋሉ።\n2. የAI ስርዓቱ ፊቶችን እና የተሽከርካሪ የሰሌዳ ቁጥሮችን ይለያል።\n3. መለያዎቹ ከእኛ ገባሪ የሪፖርቶች ዳታቤዝ ጋር ይነጻጸራሉ።\n4. ትክክለኛ ግጥሚያ ሲገኝ ስርዓቱ ወዲያውኑ መልዕክት ያመነጫል።\n5. ትክክለኛውን ቦታ የያዘ ማሳሰቢያ በድረገጹ፣ በኢሜል ወይም በቴሌግራም ቦት ይላክልዎታል።",
      pricing: "የአገልግሎት ክፍያ እና የምዝገባ እቅዶች የሚከተሉት ናቸው፡\n\n1. **ነፃ አካውንት**፦ 1 የጠፋ ሪፖርት በነጻ መመዝገብ ይችላሉ (መሰረታዊ የካርታ አጠቃቀምን ያካትታል)።\n2. **ፕሪሚየም አገልግሎት**፦ በወር ከ360 ብር ጀምሮ (በቻፓ አስተማማኝ ክፍያ የሚከፈል) ሲሆን የሚከተሉትን ያካትታል፡\n   - ያልተገደበ የጠፋ ሪፖርት መመዝገብ፣\n   - ፈጣን የAI ፊት እና የሰሌዳ አሰሳ፣\n   - የፈጣን የኤስኤምኤስ እና የቴሌግራም ማሳሰቢያዎች፣\n   - የጂፒኤስ ዘመናዊ ቀበቶዎችን በቀጥታ መከታተል።",
      help: "የድረገጻችንን ዋና ዋና ክፍሎች ለመጠቀም እነዚህን ደረጃዎች ይከተሉ፡\n\n1. **ጉዳዮችን መከታተል**፦ በጠፉ ሰዎች ወይም መኪኖች ማውጫ ውስጥ ሪፖርቶችን መፈለግ።\n2. **እይታዎችን መመዝገብ**፦ በካርታው ላይ አዲስ ያዩትን ነገር ምልክት በማድረግ ማህበረሰቡን ማገዝ።\n3. **ጂፒኤስ መከታተል**፦ የልጆችን ወይም አረጋውያንን ቦታ በቀጥታ ለመከታተል የጂፒኤስ ቀበቶ ማገናኘት።\n4. **መልዕክቶችን መቀበል**፦ ፈጣን መረጃዎችን ለማግኘት የቴሌግራም አካውንትዎን ማገናኘት።",
      fallback: "ስለዚህ ጉዳይ እርግጠኛ አይደለሁም። ተጨማሪ ድጋፍ ለማግኘት የሚከተሉትን ያድርጉ፡\n\n1. ወደ ቅንብሮች (Settings) ገጽ ይሂዱ እና 'ግብረመልስ ስጥ' የሚለውን ይምረጡ።\n2. ጥያቄዎን ወይም ያጋጠመዎትን ችግር በቀጥታ ለገንቢዎቻችን ይላኩ።\n3. ለተጨማሪ እርዳታ በ contact@flega.com ያግኙን።"
    },
    keywords: {
      reporting: ["ሪፖርት", "መመዝገብ", "መዝግብ", "የጠፋ", "መዝገብ", "ፍጠር"],
      cameras: ["ካሜራ", "አሰሳ", "ፊልም", "ሲሲቲቪ", "ማሽን", "እውቅና"],
      pricing: ["ነፃ", "ክፍያ", "ብር", "ፕሪሚየም", "ቻፓ", "ዋጋ", "መግዛት"],
      help: ["እገዛ", "ረዳት", "አጠቃቀም", "እንዴት", "ምን", "መረጃ"]
    }
  },
  om: {
    title: "Flega AI Assistant",
    subtitle: "24/7 Gargaarsa",
    online: "Online",
    placeholder: "Waa'ee website gaafadhu...",
    welcome: "Akkam! Ani gargaara kee Flega AI Assistant ti. Har'a dhimma dhabame ykn konkolaataa bade deebisuuf akkamitti si gargaaruu danda'a?",
    clearHistory: "Qulqulleessi",
    chips: [
      { text: "Dhimma akkamittin gabaasa?", value: "reporting" },
      { text: "Kaameeraa detection akkamitti hojjata?", value: "cameras" },
      { text: "Galmeen bilisaa?", value: "pricing" },
      { text: "Platform kanaan maal gochuu danda'ama?", value: "help" }
    ],
    responses: {
      reporting: "Dhimma dhabame gabaasuuf tarkaanfiiwwan qabatamaa armaan gadii hordofi:\n\n1. Daashboordii kee irratti 'Report Missing' kan jedhu cuqaasi.\n2. Gosa gabaasaa filadhu (Nama bade, Konkolaataa bade, ykn Dhimma addaa).\n3. Ibsa bu'uraa guuti (maqaa, gabatee konkolaataa, saala, umrii, hojjaa).\n4. Kaartaa interactive irratti 'Bakka Dhumaa Itti Argame' filadhu.\n5. Suuraalee qulqulluu fi dhiyoo galchi (yoo xiqqaate suuraa 2).\n6. Kategori addaatiif (fkn. sammuu dhibee), ragaa yaalaa ykn waraqaa mana murti galchi.\n7. Ibsa hunda erga ilaaltee booda 'Submit Report' cuqaasi.",
      cameras: "Kaameeraan AI-powered matching yeroo 24/7 haala kanaan hojjata:\n\n1. Kaameeraaleen naannoo uummataa fi CCTV feeds battalatti ni sakatta'u.\n2. Sistamni AI fuula fi gabatee konkolaataa adda baasa.\n3. Engine keenya odeeffannoo kana dhimmoota galmee socho'aa jiran wajjin wal-bira qaba.\n4. Yeroo verified match argamu, battalatti akeekkachiisni ni ergama.\n5. Coordinates bakka argamichaa kaartaa wajjin In-App, Imeelii ykn Telegram bot irratti siif ergama.",
      pricing: "Akkaataa gatii fi qophii galmee keenyaa haala kanaan dhiyateera:\n\n1. **Herrega Bilisaa**: Gabaasa socho'aa 1 bilisaan gabaasuu dandeessu (bu'ura kaartaa ni dabalata).\n2. **Premium Upgrade**: Ji'atti 360 birr irraa jalqaba (karaa Chapa secure ta'een kan kafalamu), dandeettiiwwan:\n   - Gabaasa daangaa malee galmeessuu.\n   - Dursa AI facial fi license plate barbaachaa argachuu.\n   - Battalatti SMS fi Telegram bot alerts.\n   - GPS smart belts sochii isaanii live hordofuu.",
      help: "Dandeettiiwwan pilaatfoormii keenyaa haala kanaan fayyadamaa:\n\n1. **Gabaasa Hordofuu**: Directory uummataa irratti nama ykn konkolaataa bade barbaaduu.\n2. **Sightings Gabaasuu**: Kaartaa irratti bakka argamuu dhimma badee mallatteessuun uummata gargaaruu.\n3. **GPS Hordofuu**: Smart GPS belts daashboordii keetti fe'uun daa'imman/maanguddoota hordofuu.\n4. **Telegram Qunnamsiisuu**: Akeekkachiisa battalaa argachuuf Telegram account kee qunnamsiisi.",
      fallback: "Waa'ee kanaa sirriitti hin beeku. Gargaarsa dabalataaf tarkaanfiiwwan armaan gadii hordofi:\n\n1. Sajataa (Settings) keessa gabiiti 'Give Feedback' filadhu.\n2. Gaaffii kee ykn rakkina si mudate battalatti gara developers keenyaatti ergi.\n3. Gargaarsa dabalataaf email keenya contact@flega.com irratti nu barreessi."
    },
    keywords: {
      reporting: ["gabaas", "bade", "galmeess", "dhimma", "missing", "lost"],
      cameras: ["kaameera", "cctv", "matching", "detection", "adda baas", "plate", "face"],
      pricing: ["bilisa", "gatii", "subscription", "premium", "birr", "chapa", "kafalltii", "free"],
      help: ["help", "gargaar", "akkamitti", "hojjata", "seenaa", "info"]
    }
  }
};

export default function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [lang, setLang] = useState('en');
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const scrollRef = useRef(null);

  // Initialize Language and Custom Event Listener
  useEffect(() => {
    setMounted(true);
    
    const loadLanguage = () => {
      const globalLang = localStorage.getItem('app_language');
      if (globalLang && localizedData[globalLang]) {
        setLang(globalLang);
      } else {
        setLang('en');
      }
    };

    loadLanguage();

    const handleLangChange = (e) => {
      if (e.detail && localizedData[e.detail]) {
        setLang(e.detail);
      }
    };

    window.addEventListener('appLanguageChanged', handleLangChange);
    return () => {
      window.removeEventListener('appLanguageChanged', handleLangChange);
    };
  }, []);

  // Setup Initial Welcome Message on Open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        { id: 'welcome', sender: 'bot', text: localizedData[lang].welcome }
      ]);
    }
  }, [isOpen, lang, messages.length]);

  // Auto Scroll to Bottom on New Messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  if (!mounted) return null;

  const activeLang = localizedData[lang] || localizedData.en;

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    // 1. Add User Message
    const userMsg = { id: Date.now().toString(), sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

    // 2. Trigger Typing Animation
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      let matchedKey = null;
      const lowerText = text.toLowerCase();

      // Check keyword mapping for a match
      for (const [key, keywordList] of Object.entries(activeLang.keywords)) {
        if (keywordList.some(kw => lowerText.includes(kw))) {
          matchedKey = key;
          break;
        }
      }

      // Find reply
      const replyText = matchedKey ? activeLang.responses[matchedKey] : activeLang.responses.fallback;
      
      const botMsg = { id: (Date.now() + 1).toString(), sender: 'bot', text: replyText };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 1000);
  };

  const handleChipClick = (value) => {
    const chipText = activeLang.chips.find(c => c.value === value)?.text || value;
    handleSendMessage(chipText);
  };

  const handleClearHistory = () => {
    setMessages([
      { id: 'welcome', sender: 'bot', text: activeLang.welcome }
    ]);
  };

  return (
    <Box style={{ position: 'fixed', bottom: '140px', right: '20px', zIndex: 1000 }}>
      {/* Pulse Animation Trigger Button */}
      <ActionIcon
        variant="filled"
        radius="xl"
        size="lg"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          boxShadow: '0 4px 16px rgba(0, 52, 209, 0.25)',
          transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          background: 'linear-gradient(135deg, #0034D1 0%, #2F80ED 100%)',
          animation: !isOpen ? 'pulse 2.5s infinite' : 'none',
        }}
        sx={{
          '&:hover': {
            transform: 'scale(1.1) rotate(10deg)',
          }
        }}
      >
        {isOpen ? <IconX size={20} /> : <IconRobot size={20} />}
      </ActionIcon>

      {/* Styled pulsing keyframes */}
      <style>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(0, 52, 209, 0.4);
          }
          70% {
            box-shadow: 0 0 0 12px rgba(0, 52, 209, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(0, 52, 209, 0);
          }
        }
      `}</style>

      {/* Chat Window Panel */}
      {isOpen && (
        <Paper
          withBorder
          radius="xl"
          p="md"
          style={{
            position: 'absolute',
            bottom: '55px',
            right: 0,
            width: '360px',
            height: '460px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid rgba(0, 52, 209, 0.12)',
            background: 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* Header */}
          <Group justify="space-between" mb="xs" style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.05)', paddingBottom: '10px' }} wrap="nowrap">
            <Group gap="xs" wrap="nowrap">
              <Avatar
                radius="xl"
                size="md"
                style={{
                  background: 'linear-gradient(135deg, #0034D1 0%, #2F80ED 100%)',
                  boxShadow: '0 4px 8px rgba(0, 52, 209, 0.2)'
                }}
              >
                <IconRobot size={18} color="white" />
              </Avatar>
              <Box style={{ overflow: 'hidden' }}>
                <Text size="sm" fw={750} c="blue" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {activeLang.title}
                  <IconSparkles size={12} color="#F2C94C" style={{ fill: '#F2C94C' }} />
                </Text>
                <Group gap="4px" align="center" wrap="nowrap">
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#40C057' }}></span>
                  <Text size="10px" c="dimmed" fw={500}>{activeLang.subtitle} • {activeLang.online}</Text>
                </Group>
              </Box>
            </Group>
            
            <Group gap="xs">
              <ActionIcon variant="subtle" color="gray" size="sm" onClick={handleClearHistory} title={activeLang.clearHistory}>
                <IconTrash size={15} />
              </ActionIcon>
              <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => setIsOpen(false)}>
                <IconX size={16} />
              </ActionIcon>
            </Group>
          </Group>

          {/* Messages Area */}
          <ScrollArea style={{ flex: 1, paddingRight: '5px' }} viewportRef={scrollRef} mb="xs">
            <Box style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '5px 0' }}>
              {messages.map((msg) => {
                const isBot = msg.sender === 'bot';
                return (
                  <Box
                    key={msg.id}
                    style={{
                      alignSelf: isBot ? 'flex-start' : 'flex-end',
                      maxWidth: '82%',
                    }}
                  >
                    <Paper
                      radius="md"
                      p="xs"
                      style={{
                        background: isBot 
                          ? '#F1F3F5' 
                          : 'linear-gradient(135deg, #0034D1 0%, #2F80ED 100%)',
                        color: isBot ? '#212529' : 'white',
                        boxShadow: isBot 
                          ? 'none' 
                          : '0 4px 10px rgba(0, 52, 209, 0.15)',
                        borderTopLeftRadius: isBot ? 0 : '8px',
                        borderTopRightRadius: isBot ? '8px' : 0,
                      }}
                    >
                      <Text size="xs" style={{ lineHeight: 1.4, whiteSpace: 'pre-line' }}>{msg.text}</Text>
                    </Paper>
                  </Box>
                );
              })}

              {/* Typing Loader bubble */}
              {isTyping && (
                <Box style={{ alignSelf: 'flex-start', maxWidth: '80%' }}>
                  <Paper
                    radius="md"
                    p="xs"
                    style={{
                      background: '#F1F3F5',
                      borderTopLeftRadius: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '8px 12px'
                    }}
                  >
                    <span className="dot" style={{ animationDelay: '0s' }}></span>
                    <span className="dot" style={{ animationDelay: '0.2s' }}></span>
                    <span className="dot" style={{ animationDelay: '0.4s' }}></span>
                  </Paper>
                </Box>
              )}
            </Box>
          </ScrollArea>

          {/* Suggestions Chips (shown when only welcome message is present) */}
          {messages.length === 1 && !isTyping && (
            <Box mb="xs">
              <Text size="10px" fw={700} c="dimmed" mb="4px" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Quick Help Questions</Text>
              <Group gap="6px" wrap="wrap">
                {activeLang.chips.map((chip, idx) => (
                  <Button
                    key={idx}
                    variant="light"
                    color="blue"
                    size="xs"
                    radius="xl"
                    fw={600}
                    onClick={() => handleChipClick(chip.value)}
                    style={{
                      fontSize: '10px',
                      height: '24px',
                      padding: '0 8px',
                      background: 'rgba(0, 52, 209, 0.06)',
                      border: '1px solid rgba(0, 52, 209, 0.08)',
                      transition: 'all 0.2s ease',
                    }}
                    sx={{
                      '&:hover': {
                        background: 'rgba(0, 52, 209, 0.1)',
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    {chip.text}
                  </Button>
                ))}
              </Group>
            </Box>
          )}

          {/* Message Input Box */}
          <Group gap="xs" wrap="nowrap" style={{ borderTop: '1px solid rgba(0, 0, 0, 0.05)', paddingTop: '10px' }}>
            <TextInput
              placeholder={activeLang.placeholder}
              value={inputValue}
              onChange={(event) => setInputValue(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleSendMessage(inputValue);
                }
              }}
              style={{ flex: 1 }}
              radius="md"
              size="xs"
              rightSection={
                <ActionIcon 
                  variant="subtle" 
                  color="blue" 
                  size="sm" 
                  onClick={() => handleSendMessage(inputValue)}
                  disabled={!inputValue.trim()}
                >
                  <IconSend size={14} />
                </ActionIcon>
              }
            />
          </Group>
        </Paper>
      )}

      {/* Typing Bubble Animations */}
      <style>{`
        .dot {
          width: 5px;
          height: 5px;
          background-color: #868E96;
          border-radius: 50%;
          display: inline-block;
          animation: bounce 1.4s infinite ease-in-out both;
        }
        @keyframes bounce {
          0%, 80%, 100% { 
            transform: scale(0);
          } 40% { 
            transform: scale(1.0);
          }
        }
      `}</style>
    </Box>
  );
}
