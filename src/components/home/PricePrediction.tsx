import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  TrendingDown, TrendingUp, Clock, Bell, Zap, 
  ArrowRight, Sparkles, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const predictions = [
  {
    id: 1,
    route: "Delhi → Goa",
    type: "flight",
    currentPrice: 4999,
    predictedPrice: 3499,
    prediction: "drop",
    confidence: 87,
    timeframe: "Next 3 days",
    recommendation: "Wait to book",
    savings: 1500,
    href: "/flights?from=Delhi&to=Goa"
  },
  {
    id: 2,
    route: "Mumbai → Dubai",
    type: "flight",
    currentPrice: 12999,
    predictedPrice: 15999,
    prediction: "rise",
    confidence: 92,
    timeframe: "Within 24 hours",
    recommendation: "Book now!",
    savings: 3000,
    href: "/flights?from=Mumbai&to=Dubai"
  },
  {
    id: 3,
    route: "Taj Lands End, Mumbai",
    type: "hotel",
    currentPrice: 8999,
    predictedPrice: 6999,
    prediction: "drop",
    confidence: 78,
    timeframe: "Next weekend",
    recommendation: "Wait for deals",
    savings: 2000,
    href: "/hotels"
  },
  {
    id: 4,
    route: "Bangalore → Delhi",
    type: "flight",
    currentPrice: 3299,
    predictedPrice: 4599,
    prediction: "rise",
    confidence: 85,
    timeframe: "Tomorrow",
    recommendation: "Book now!",
    savings: 1300,
    href: "/flights?from=Bangalore&to=Delhi"
  }
];

export const PricePrediction = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-10"
        >
          <div>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-full mb-4">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">AI-Powered Insights</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Price <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">Predictor</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl">
              Our AI analyzes millions of data points to predict price movements. Save money by booking at the right time!
            </p>
          </div>
          
          <Button variant="outline" className="mt-4 md:mt-0 rounded-full">
            <Bell className="w-4 h-4 mr-2" />
            Set Price Alerts
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {predictions.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={item.href}>
                <div className={`relative p-6 rounded-2xl border overflow-hidden transition-all hover:shadow-xl ${
                  item.prediction === "drop" 
                    ? "bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border-emerald-500/20 hover:border-emerald-500/40" 
                    : "bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-500/20 hover:border-amber-500/40"
                }`}>
                  {/* Recommendation Badge */}
                  <Badge 
                    className={`absolute top-4 right-4 ${
                      item.prediction === "rise" 
                        ? "bg-amber-500 text-white" 
                        : "bg-emerald-500 text-white"
                    }`}
                  >
                    {item.prediction === "rise" ? (
                      <AlertCircle className="w-3 h-3 mr-1" />
                    ) : (
                      <Clock className="w-3 h-3 mr-1" />
                    )}
                    {item.recommendation}
                  </Badge>

                  <div className="flex items-start gap-4">
                    {/* Trend Icon */}
                    <div className={`p-3 rounded-xl ${
                      item.prediction === "drop" 
                        ? "bg-emerald-500/10 text-emerald-500" 
                        : "bg-amber-500/10 text-amber-500"
                    }`}>
                      {item.prediction === "drop" ? (
                        <TrendingDown className="w-6 h-6" />
                      ) : (
                        <TrendingUp className="w-6 h-6" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {item.type === "flight" ? "✈️ Flight" : "🏨 Hotel"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{item.timeframe}</span>
                      </div>
                      
                      <h3 className="font-semibold text-lg mb-2">{item.route}</h3>
                      
                      {/* Price Display */}
                      <div className="flex items-baseline gap-3 mb-3">
                        <span className="text-sm text-muted-foreground">Current:</span>
                        <span className="text-xl font-bold">₹{item.currentPrice.toLocaleString()}</span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        <span className={`text-xl font-bold ${
                          item.prediction === "drop" ? "text-emerald-500" : "text-amber-500"
                        }`}>
                          ₹{item.predictedPrice.toLocaleString()}
                        </span>
                      </div>

                      {/* Confidence Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">AI Confidence</span>
                          <span className="font-medium">{item.confidence}%</span>
                        </div>
                        <Progress 
                          value={item.confidence} 
                          className={`h-2 ${
                            item.prediction === "drop" 
                              ? "[&>div]:bg-emerald-500" 
                              : "[&>div]:bg-amber-500"
                          }`}
                        />
                      </div>

                      {/* Savings */}
                      <div className={`mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                        item.prediction === "drop"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }`}>
                        <Sparkles className="w-3 h-3" />
                        {item.prediction === "drop" 
                          ? `Save ₹${item.savings.toLocaleString()} by waiting`
                          : `Book now to save ₹${item.savings.toLocaleString()}`
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
