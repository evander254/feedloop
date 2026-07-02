import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import ResetPassword from "@/pages/ResetPassword";
import FormBuilder from "@/pages/FormBuilder";
import FormOrgSelect from "@/pages/FormOrgSelect";
import PublicForm from "@/pages/PublicForm";
import FormResponses from "@/pages/FormResponses";
import Forms from "@/pages/Forms";
import Surveys from "@/pages/Surveys";
import SurveyBuilder from "@/pages/SurveyBuilder";
import PublicSurvey from "@/pages/PublicSurvey";
import SurveyResponses from "@/pages/SurveyResponses";
import Polls from "@/pages/Polls";
import PollBuilder from "@/pages/PollBuilder";
import PublicPoll from "@/pages/PublicPoll";
import PollResults from "@/pages/PollResults";
import Profile from "@/pages/Profile";
import Organizations from "@/pages/Organizations";

const Dashboard = lazy(() => import("@/pages/Dashboard"));

export default function App() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#f7faf7]">
        <div className="size-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    }>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/builder" element={<FormBuilder />} />
        <Route path="/builder/new" element={<FormOrgSelect />} />
        <Route path="/form/:formId" element={<PublicForm />} />
        <Route path="/forms" element={<Forms />} />
        <Route path="/forms/:formId/responses" element={<FormResponses />} />
        <Route path="/surveys" element={<Surveys />} />
        <Route path="/surveys/new" element={<SurveyBuilder />} />
        <Route path="/survey/:surveyId" element={<PublicSurvey />} />
        <Route path="/surveys/:surveyId/responses" element={<SurveyResponses />} />
        <Route path="/polls" element={<Polls />} />
        <Route path="/polls/new" element={<PollBuilder />} />
        <Route path="/poll/:pollId" element={<PublicPoll />} />
        <Route path="/polls/:pollId/results" element={<PollResults />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/organizations" element={<Organizations />} />
      </Routes>
    </Suspense>
  );
}
