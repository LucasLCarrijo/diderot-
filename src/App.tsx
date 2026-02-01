import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import ErrorBoundary from "@/components/ErrorBoundary";
import SearchPage from "./pages/Search";
import CategoryDiscover from "./pages/discover/Category";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import CreatorPage from "./pages/CreatorPage";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import CreatorOnboarding from "./pages/onboarding/CreatorOnboarding";
import Shop from "./pages/creator/Shop";
import ProductNew from "./pages/creator/ProductNew";
import ProductEdit from "./pages/creator/ProductEdit";
import Posts from "./pages/creator/Posts";
import PostNew from "./pages/creator/PostNew";
import PostEdit from "./pages/creator/PostEdit";
import Audience from "./pages/creator/Audience";
import Analytics from "./pages/creator/Analytics";
import Collections from "./pages/creator/Collections";
import CollectionNew from "./pages/creator/CollectionNew";
import CollectionEdit from "./pages/creator/CollectionEdit";
import CreatorSettings from "./pages/creator/Settings";
import Pricing from "./pages/creator/Pricing";
import Billing from "./pages/creator/Billing";
import ProductPage from "./pages/ProductPage";
import PostPage from "./pages/PostPage";
import CollectionPage from "./pages/CollectionPage";
import TrackRedirect from "./pages/TrackRedirect";
import UsernameRedirect from "./pages/UsernameRedirect";
import Feed from "./pages/me/Feed";
import Wishlists from "./pages/me/Wishlists";
import Following from "./pages/me/Following";
import Profile from "./pages/me/Profile";
import Settings from "./pages/me/Settings";
import Notifications from "./pages/Notifications";
import DiscoverCreators from "./pages/discover/Creators";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import AdminOverview from "./pages/admin/Overview";
import AdminUsers from "./pages/admin/Users";
import AdminFinancials from "./pages/admin/Financials";
import AdminNorthStar from "./pages/admin/NorthStar";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminContent from "./pages/admin/Content";
import AdminBrands from "./pages/admin/Brands";
import AdminModeration from "./pages/admin/Moderation";
import AdminSettings from "./pages/admin/Settings";
import AdminNotifications from "./pages/admin/Notifications";
import { AdminLayout } from "./components/admin/AdminLayout";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth/signin" element={<SignIn />} />
                <Route path="/auth/signup" element={<SignUp />} />
                <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                <Route path="/auth/reset-password" element={<ResetPassword />} />
                <Route
                  path="/onboarding/creator"
                  element={
                    <ProtectedRoute>
                      <CreatorOnboarding />
                    </ProtectedRoute>
                  }
                />
                <Route path="/creator/shop" element={<ProtectedRoute requiredRole="creator"><Shop /></ProtectedRoute>} />
                <Route path="/creator/shop/new" element={<ProtectedRoute requiredRole="creator"><ProductNew /></ProtectedRoute>} />
                <Route path="/creator/shop/:id/edit" element={<ProtectedRoute requiredRole="creator"><ProductEdit /></ProtectedRoute>} />
                <Route path="/creator/posts" element={<ProtectedRoute requiredRole="creator"><Posts /></ProtectedRoute>} />
                <Route path="/creator/posts/new" element={<ProtectedRoute requiredRole="creator"><PostNew /></ProtectedRoute>} />
                <Route path="/creator/posts/:id/edit" element={<ProtectedRoute requiredRole="creator"><PostEdit /></ProtectedRoute>} />
                <Route path="/creator/audience" element={<ProtectedRoute requiredRole="creator"><Audience /></ProtectedRoute>} />
                <Route path="/creator/analytics" element={<ProtectedRoute requiredRole="creator"><Analytics /></ProtectedRoute>} />
                <Route path="/creator/collections" element={<ProtectedRoute requiredRole="creator"><Collections /></ProtectedRoute>} />
                <Route path="/creator/collections/new" element={<ProtectedRoute requiredRole="creator"><CollectionNew /></ProtectedRoute>} />
                <Route path="/creator/collections/:id/edit" element={<ProtectedRoute requiredRole="creator"><CollectionEdit /></ProtectedRoute>} />
                <Route path="/creator/settings" element={<ProtectedRoute requiredRole="creator"><CreatorSettings /></ProtectedRoute>} />
                <Route path="/creator/pricing" element={<ProtectedRoute requiredRole="creator"><Pricing /></ProtectedRoute>} />
                <Route path="/creator/billing" element={<ProtectedRoute requiredRole="creator"><Billing /></ProtectedRoute>} />
                <Route path="/r/track" element={<TrackRedirect />} />
                <Route path="/p/:slug" element={<ProductPage />} />
                <Route path="/posts/:id" element={<PostPage />} />
                <Route path="/c/:id" element={<CollectionPage />} />
                <Route path="/me/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
                <Route path="/me/wishlists" element={<ProtectedRoute><Wishlists /></ProtectedRoute>} />
                <Route path="/me/following" element={<ProtectedRoute><Following /></ProtectedRoute>} />
                <Route path="/me/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/me/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                <Route path="/discover/creators" element={<DiscoverCreators />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/discover/category/:slug" element={<CategoryDiscover />} />
                <Route path="/about" element={<About />} />
                {/* Admin routes - wrapped with AdminLayout for shared context */}
                <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminLayout><AdminOverview /></AdminLayout></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute requiredRole="admin"><AdminLayout><AdminUsers /></AdminLayout></ProtectedRoute>} />
                <Route path="/admin/financials" element={<ProtectedRoute requiredRole="admin"><AdminLayout><AdminFinancials /></AdminLayout></ProtectedRoute>} />
                <Route path="/admin/north-star" element={<ProtectedRoute requiredRole="admin"><AdminLayout><AdminNorthStar /></AdminLayout></ProtectedRoute>} />
                <Route path="/admin/analytics" element={<ProtectedRoute requiredRole="admin"><AdminLayout><AdminAnalytics /></AdminLayout></ProtectedRoute>} />
                <Route path="/admin/content" element={<ProtectedRoute requiredRole="admin"><AdminLayout><AdminContent /></AdminLayout></ProtectedRoute>} />
                <Route path="/admin/brands" element={<ProtectedRoute requiredRole="admin"><AdminLayout><AdminBrands /></AdminLayout></ProtectedRoute>} />
                <Route path="/admin/moderation" element={<ProtectedRoute requiredRole="admin"><AdminLayout><AdminModeration /></AdminLayout></ProtectedRoute>} />
                <Route path="/admin/settings" element={<ProtectedRoute requiredRole="admin"><AdminLayout><AdminSettings /></AdminLayout></ProtectedRoute>} />
                <Route path="/admin/notifications" element={<ProtectedRoute requiredRole="admin"><AdminLayout><AdminNotifications /></AdminLayout></ProtectedRoute>} />
                {/* Redirect /@username to /username */}
                <Route path="/@:username" element={<UsernameRedirect />} />
                {/* Creator public profile - canonical route */}
                <Route path="/:username" element={<CreatorPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
