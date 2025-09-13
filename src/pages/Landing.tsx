import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, MessageCircle, Users, Brain, Sparkles, Zap, Globe, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-social.jpg";

const Landing = () => {
  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "Smart Feed",
      description: "Personalized, ad-free content curated by AI that learns your preferences",
      badge: "No Ads"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Collaborative Posts",
      description: "Co-create reels, blogs, and stories with friends in real-time",
      badge: "Team Work"
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "AI Content Magic",
      description: "Smart hashtag suggestions, post summaries, and auto-translations",
      badge: "Smart"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Real-time Stories",
      description: "24-hour disappearing stories with AI effects and filters",
      badge: "Live"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Privacy First",
      description: "End-to-end encryption for messages and complete data control",
      badge: "Secure"
    }
  ];

  const stats = [
    { number: "10M+", label: "Active Users" },
    { number: "500M+", label: "Posts Created" },
    { number: "99.9%", label: "Uptime" },
    { number: "50+", label: "Languages" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary-glow rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              SocialAI
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/auth">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI-Powered Social Platform
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                  The Future of
                  <span className="bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
                    {" "}Social Media
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-lg">
                  Experience intelligent social networking with AI-powered content creation 
                  and collaborative storytelling.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/auth">
                  <Button size="lg" className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90">
                    <Globe className="w-5 h-5 mr-2" />
                    Join the Revolution
                  </Button>
                </Link>
                <Button size="lg" variant="outline">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Learn More
                </Button>
              </div>
              
              <div className="grid grid-cols-4 gap-6 pt-8 border-t">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl font-bold text-primary">{stat.number}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-2xl"></div>
              <img 
                src={heroImage} 
                alt="Social AI Platform"
                className="relative w-full h-auto rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Features</Badge>
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">
              Powered by Advanced AI
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Every feature is designed to enhance your social experience with 
              cutting-edge artificial intelligence and seamless collaboration.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-2xl transition-all duration-300 bg-gradient-to-b from-card to-card/50 border-0">
                <CardContent className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                    <div className="text-primary">{feature.icon}</div>
                  </div>
                  <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary">
                    {feature.badge}
                  </Badge>
                  <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl lg:text-5xl font-bold">
              Ready to Experience the Future?
            </h2>
            <p className="text-lg text-muted-foreground">
              Join millions of users who are already creating, collaborating, and connecting 
              in ways never before possible.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90">
                  <Users className="w-5 h-5 mr-2" />
                  Start Creating Now
                </Button>
              </Link>
              <Button size="lg" variant="outline">
                <MessageCircle className="w-5 h-5 mr-2" />
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary-glow rounded-lg flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">SocialAI</span>
              </div>
              <p className="text-muted-foreground">
                The future of social media, powered by AI and built for creators.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">About</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-12 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 SocialAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;