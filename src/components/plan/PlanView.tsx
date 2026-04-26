import type { ExperimentPlan } from "@/types/experiment";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlanOverview } from "./tabs/PlanOverview";
import { PlanProtocol } from "./tabs/PlanProtocol";
import { PlanMaterials } from "./tabs/PlanMaterials";
import { PlanBudget } from "./tabs/PlanBudget";
import { PlanTimeline } from "./tabs/PlanTimeline";
import { PlanValidation } from "./tabs/PlanValidation";
import { PlanSafety } from "./tabs/PlanSafety";
import { PlanCritique } from "./tabs/PlanCritique";
import {
  Beaker,
  ListChecks,
  Package,
  CircleDollarSign,
  CalendarRange,
  Target,
  ShieldAlert,
  GitBranch,
} from "lucide-react";

const TABS = [
  { value: "overview",   label: "Overview",   icon: Beaker },
  { value: "protocol",   label: "Protocol",   icon: ListChecks },
  { value: "materials",  label: "Materials",  icon: Package },
  { value: "budget",     label: "Budget",     icon: CircleDollarSign },
  { value: "timeline",   label: "Timeline",   icon: CalendarRange },
  { value: "validation", label: "Validation", icon: Target },
  { value: "safety",     label: "Safety",     icon: ShieldAlert },
  { value: "critique",   label: "Critique",   icon: GitBranch },
];

export function PlanView({ plan }: { plan: ExperimentPlan }) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <div className="-mx-6 mb-6 overflow-x-auto px-6 md:mx-0 md:px-0">
        <TabsList className="inline-flex h-auto w-auto gap-1 bg-surface-1 p-1">
          {TABS.map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="gap-1.5 px-3 py-1.5 text-xs font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow"
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <TabsContent value="overview"   className="animate-fade-up"><PlanOverview   plan={plan} /></TabsContent>
      <TabsContent value="protocol"   className="animate-fade-up"><PlanProtocol   plan={plan} /></TabsContent>
      <TabsContent value="materials"  className="animate-fade-up"><PlanMaterials  plan={plan} /></TabsContent>
      <TabsContent value="budget"     className="animate-fade-up"><PlanBudget     plan={plan} /></TabsContent>
      <TabsContent value="timeline"   className="animate-fade-up"><PlanTimeline   plan={plan} /></TabsContent>
      <TabsContent value="validation" className="animate-fade-up"><PlanValidation plan={plan} /></TabsContent>
      <TabsContent value="safety"     className="animate-fade-up"><PlanSafety     plan={plan} /></TabsContent>
      <TabsContent value="critique"   className="animate-fade-up"><PlanCritique   plan={plan} /></TabsContent>
    </Tabs>
  );
}
