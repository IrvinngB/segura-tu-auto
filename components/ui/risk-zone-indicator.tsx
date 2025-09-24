import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { MapPin, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface RiskZoneIndicatorProps {
    zone: "low" | "medium" | "high" | "very_high";
    city?: string;
    state?: string;
    className?: string;
}

const riskZoneConfig = {
    low: {
        label: "Bajo Riesgo",
        color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        icon: TrendingDown,
        description: "Tu ubicación tiene factores de riesgo favorables",
        multiplier: "15% descuento",
        bgClass: "bg-green-50 dark:bg-green-950",
    },
    medium: {
        label: "Riesgo Medio",
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        icon: Minus,
        description: "Tu ubicación tiene factores de riesgo moderados",
        multiplier: "Prima estándar",
        bgClass: "bg-blue-50 dark:bg-blue-950",
    },
    high: {
        label: "Alto Riesgo",
        color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
        icon: TrendingUp,
        description: "Tu ubicación tiene factores de riesgo elevados",
        multiplier: "25% incremento",
        bgClass: "bg-orange-50 dark:bg-orange-950",
    },
    very_high: {
        label: "Muy Alto Riesgo",
        color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        icon: TrendingUp,
        description: "Tu ubicación tiene factores de riesgo muy elevados",
        multiplier: "50% incremento",
        bgClass: "bg-red-50 dark:bg-red-950",
    },
};

export function RiskZoneIndicator({
    zone,
    city,
    state,
    className = "",
}: RiskZoneIndicatorProps) {
    const config = riskZoneConfig[zone];
    const IconComponent = config.icon;

    return (
        <Card className={`${config.bgClass} border-l-4 ${className}`}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Zona de Riesgo
                    </CardTitle>
                    <Badge className={config.color}>
                        <IconComponent className="h-3 w-3 mr-1" />
                        {config.label}
                    </Badge>
                </div>
                {(city || state) && (
                    <CardDescription className="text-xs">
                        {city}
                        {city && state && ", "}
                        {state}
                    </CardDescription>
                )}
            </CardHeader>
            <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground mb-2">
                    {config.description}
                </p>
                <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                        Impacto en prima:
                    </span>
                    <span className="font-medium">{config.multiplier}</span>
                </div>
            </CardContent>
        </Card>
    );
}

// Component para mostrar solo el badge sin la card completa
export function RiskZoneBadge({
    zone,
    className = "",
}: {
    zone: "low" | "medium" | "high" | "very_high";
    className?: string;
}) {
    const config = riskZoneConfig[zone];
    const IconComponent = config.icon;

    return (
        <Badge className={`${config.color} ${className}`}>
            <IconComponent className="h-3 w-3 mr-1" />
            {config.label}
        </Badge>
    );
}
