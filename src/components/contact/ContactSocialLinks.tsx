import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Facebook, Instagram, Twitter, Youtube, Linkedin, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

const socialLinks = [
  {
    name: "Facebook",
    icon: Facebook,
    url: "https://facebook.com/anaghasafar",
    color: "hover:bg-blue-600 hover:text-white",
    followers: "50K+"
  },
  {
    name: "Instagram",
    icon: Instagram,
    url: "https://instagram.com/anaghasafar",
    color: "hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 hover:text-white",
    followers: "120K+"
  },
  {
    name: "Twitter",
    icon: Twitter,
    url: "https://twitter.com/anaghasafar",
    color: "hover:bg-sky-500 hover:text-white",
    followers: "25K+"
  },
  {
    name: "YouTube",
    icon: Youtube,
    url: "https://youtube.com/anaghasafar",
    color: "hover:bg-red-600 hover:text-white",
    followers: "80K+"
  },
  {
    name: "LinkedIn",
    icon: Linkedin,
    url: "https://linkedin.com/company/anaghasafar",
    color: "hover:bg-blue-700 hover:text-white",
    followers: "15K+"
  },
  {
    name: "WhatsApp",
    icon: MessageCircle,
    url: "https://wa.me/919039939555",
    color: "hover:bg-green-500 hover:text-white",
    followers: "Chat Now"
  }
];

const ContactSocialLinks = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Connect With Us</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {socialLinks.map((social, index) => (
            <motion.a
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`flex flex-col items-center p-3 rounded-lg border border-border bg-muted/50 transition-all duration-300 ${social.color}`}
            >
              <social.icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{social.name}</span>
              <span className="text-[10px] text-muted-foreground">{social.followers}</span>
            </motion.a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ContactSocialLinks;
