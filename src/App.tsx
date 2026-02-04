import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PageLoader } from "@/components/ui/PageLoader";

// Critical path - loaded immediately
import Index from "./pages/Index";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";

// Lazy loaded pages - only loaded when accessed
const SearchPage = lazy(() => import("./pages/Search"));
const CategoryDiscover = lazy(() => import("./pages/discover/Category"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const CreatorOnboarding = lazy(() => import("./pages/onboarding/CreatorOnboarding"));
const Segmentation = lazy(() => import("./pages/onboarding/Segmentation"));
const PlanSelection = lazy(() => import("./pages/onboarding/PlanSelection"));
const Checkout = lazy(() => import("./pages/onboarding/Checkout"));
const Processing = lazy(() => import("./pages/onboarding/Processing"));

// Creator pages - lazy loaded
const Shop = lazy(() => import("./pages/creator/Shop"));
const ProductNew = lazy(() => import("./pages/creator/ProductNew"));
const ProductEdit = lazy(() => import("./pages/creator/ProductEdit"));
const Posts = lazy(() => import("./pages/creator/Posts"));
const PostNew = lazy(() => import("./pages/creator/PostNew"));
const PostEdit = lazy(() => import("./pages/creator/PostEdit"));
const Audience = lazy(() => import("./pages/creator/Audience"));
const Analytics = lazy(() => import("./pages/creator/Analytics"));
const Collections = lazy(() => import("./pages/creator/Collections"));
const CollectionNew = lazy(() => import("./pages/creator/CollectionNew"));
const CollectionEdit = lazy(() => import("./pages/creator/CollectionEdit"));
const CreatorSettings = lazy(() => import("./pages/creator/Settings"));
const Pricing = lazy(() => import("./pages/creator/Pricing"));
const Billing = lazy(() => import("./pages/creator/Billing"));

// Public pages - lazy loaded
const CreatorPage = lazy(() => import("./pages/CreatorPage"));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const PostPage = lazy(() => import("./pages/PostPage"));
const CollectionPage = lazy(() => import("./pages/CollectionPage"));
const TrackRedirect = lazy(() => import("./pages/TrackRedirect"));
const UsernameRedirect = lazy(() => import("./pages/UsernameRedirect"));
const DiscoverCreators = lazy(() => import("./pages/discover/Creators"));
const About = lazy(() => import("./pages/About"));
const NotFound = lazy(() => import("./pages/NotFound"));

// User pages - lazy loaded
const Feed = lazy(() => import("./pages/me/Feed"));
const Wishlists = lazy(() => import("./pages/me/Wishlists"));
const Following = lazy(() => import("./pages/me/Following"));
const Profile = lazy(() => import("./pages/me/Profile"));
const Settings = lazy(() => import("./pages/me/Settings"));
const Notifications = lazy(() => import("./pages/Notifications"));

// Admin pages - lazy loaded (heavy with charts)
const AdminOverview = lazy(() => import("./pages/admin/Overview"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminFinancials = lazy(() => import("./pages/admin/Financials"));
const AdminNorthStar = lazy(() => import("./pages/admin/NorthStar"));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));
const AdminContent = lazy(() => import("./pages/admin/Content"));
const AdminBrands = lazy(() => import("./pages/admin/Brands"));
const AdminModeration = lazy(() => import("./pages/admin/Moderation"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminNotifications = lazy(() => import("./pages/admin/Notifications"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout").then(m => ({ default: m.AdminLayout })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute default
      gcTime: 1000 * 60 * 5, // 5 minutes cache
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Critical path - no lazy needed */}
                  <Route path="/" element={<Index />} />
                  <Route path="/auth/signin" element={<SignIn />} />
                  <Route path="/auth/signup" element={<SignUp />} />

                  {/* Auth routes */}
                  <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                  <Route path="/auth/reset-password" element={<ResetPassword />} />

                  {/* Onboarding routes */}
                  <Route path="/onboarding/creator" element={<ProtectedRoute><CreatorOnboarding /></ProtectedRoute>} />
                  <Route path="/onboarding/segmentation" element={<ProtectedRoute><Segmentation /></ProtectedRoute>} />
                  <Route path="/onboarding/plan" element={<ProtectedRoute><PlanSelection /></ProtectedRoute>} />
                  <Route path="/onboarding/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                  <Route path="/onboarding/processing" element={<ProtectedRoute><Processing /></ProtectedRoute>} />

                  {/* Creator routes */}
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

                  {/* Public content routes */}
                  <Route path="/r/track" element={<TrackRedirect />} />
                  <Route path="/p/:slug" element={<ProductPage />} />
                  <Route path="/posts/:id" element={<PostPage />} />
                  <Route path="/c/:id" element={<CollectionPage />} />

                  {/* User routes */}
                  <Route path="/me/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
                  <Route path="/me/wishlists" element={<ProtectedRoute><Wishlists /></ProtectedRoute>} />
                  <Route path="/me/following" element={<ProtectedRoute><Following /></ProtectedRoute>} />
                  <Route path="/me/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/me/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                  <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

                  {/* Discovery routes */}
                  <Route path="/discover/creators" element={<DiscoverCreators />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/discover/category/:slug" element={<CategoryDiscover />} />
                  <Route path="/about" element={<About />} />

                  {/* Admin routes */}
                  <Route path="/admin" element={
                    <ProtectedRoute requiredRole="admin">
                      <Suspense fallback={<PageLoader />}>
                        <AdminLayout><AdminOverview /></AdminLayout>
                      </Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/users" element={
                    <ProtectedRoute requiredRole="admin">
                      <Suspense fallback={<PageLoader />}>
                        <AdminLayout><AdminUsers /></AdminLayout>
                      </Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/financials" element={
                    <ProtectedRoute requiredRole="admin">
                      <Suspense fallback={<PageLoader />}>
                        <AdminLayout><AdminFinancials /></AdminLayout>
                      </Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/north-star" element={
                    <ProtectedRoute requiredRole="admin">
                      <Suspense fallback={<PageLoader />}>
                        <AdminLayout><AdminNorthStar /></AdminLayout>
                      </Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/analytics" element={
                    <ProtectedRoute requiredRole="admin">
                      <Suspense fallback={<PageLoader />}>
                        <AdminLayout><AdminAnalytics /></AdminLayout>
                      </Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/content" element={
                    <ProtectedRoute requiredRole="admin">
                      <Suspense fallback={<PageLoader />}>
                        <AdminLayout><AdminContent /></AdminLayout>
                      </Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/brands" element={
                    <ProtectedRoute requiredRole="admin">
                      <Suspense fallback={<PageLoader />}>
                        <AdminLayout><AdminBrands /></AdminLayout>
                      </Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/moderation" element={
                    <ProtectedRoute requiredRole="admin">
                      <Suspense fallback={<PageLoader />}>
                        <AdminLayout><AdminModeration /></AdminLayout>
                      </Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/settings" element={
                    <ProtectedRoute requiredRole="admin">
                      <Suspense fallback={<PageLoader />}>
                        <AdminLayout><AdminSettings /></AdminLayout>
                      </Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/notifications" element={
                    <ProtectedRoute requiredRole="admin">
                      <Suspense fallback={<PageLoader />}>
                        <AdminLayout><AdminNotifications /></AdminLayout>
                      </Suspense>
                    </ProtectedRoute>
                  } />

                  {/* Username routes - must be last */}
                  <Route path="/@:username" element={<UsernameRedirect />} />
                  <Route path="/:username" element={<CreatorPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
