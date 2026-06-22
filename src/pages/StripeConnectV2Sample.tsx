import React, { useEffect, useState } from "react";
import { useAction, useQuery } from "convex/react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShoppingBag,
  Store,
  ChevronRight,
  Sparkles,
  Package,
  Plus,
  RefreshCw,
  ArrowLeft,
  DollarSign,
  Info
} from "lucide-react";

/**
 * Stripe Connect V2 Sample UI Component.
 * This file serves as an interactive playground to onboard, create products, and test a storefront
 * using the Stripe Connect V2 API and thin webhooks.
 *
 * For any UI, we use clean HTML styled with basic Tailwind CSS that matches the rest of the application.
 */
export function StripeConnectV2Sample() {
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Query Parameters & Routing State ─────────────────────────────────────
  // If ?storefront=acct_*** is present, we render the customer-facing storefront view.
  // Otherwise, we render the creator-facing Connect v2 Dashboard view.
  const storefrontId = searchParams.get("storefront");

  // Retrieve current logged-in user's V2 account mapping (for Dashboard view)
  const myMapping = useQuery(api.connectV2.getMyV2AccountMapping);

  // ── Action triggers ──────────────────────────────────────────────────────
  const createAccount = useAction(api.connectV2.createV2Account);
  const getOnboardingLink = useAction(api.connectV2.getV2OnboardingLink);
  const getAccountStatus = useAction(api.connectV2.getV2AccountStatus);
  const createProduct = useAction(api.connectV2.createV2Product);
  const listProducts = useAction(api.connectV2.listV2Products);
  const createCheckoutSession = useAction(api.connectV2.createV2CheckoutSession);

  // ── Component Local States ───────────────────────────────────────────────
  // Account onboarding forms
  const [displayName, setDisplayName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);

  // Store status fetched directly from API
  const [apiStatus, setApiStatus] = useState<{
    readyToProcessPayments: boolean;
    requirementsStatus: string;
    onboardingComplete: boolean;
    stripeAccountStatus: string;
  } | null>(null);

  // Product forms & lists
  const [prodName, setProdName] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodPriceUSD, setProdPriceUSD] = useState("");
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Purchase/storefront checkout states
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);

  // ── Effect: Handle Redirect & Status Parameters ──────────────────────────
  useEffect(() => {
    const connectParam = searchParams.get("connect");
    const purchaseParam = searchParams.get("purchase");
    const accountIdParam = searchParams.get("accountId");

    if (connectParam === "complete") {
      toast.success("Completed onboarding redirection! Querying live account status...");
      if (accountIdParam) {
        handleRefreshStatus(accountIdParam);
      }
      // Strip params
      setSearchParams({ ...(storefrontId ? { storefront: storefrontId } : {}) });
    } else if (connectParam === "refresh") {
      toast.info("Onboarding flow was refreshed or restarted.");
      setSearchParams({ ...(storefrontId ? { storefront: storefrontId } : {}) });
    }

    if (purchaseParam === "success") {
      toast.success("Thank you for your purchase! The Direct Charge payment was processed successfully.");
      setSearchParams({ ...(storefrontId ? { storefront: storefrontId } : {}) });
    } else if (purchaseParam === "cancel") {
      toast.error("Checkout was canceled.");
      setSearchParams({ ...(storefrontId ? { storefront: storefrontId } : {}) });
    }
  }, [searchParams]);

  // ── Effect: Load products if we are viewing a storefront or have an active account ──
  useEffect(() => {
    const targetAccountId = storefrontId || myMapping?.stripeAccountId;
    if (targetAccountId) {
      handleLoadProducts(targetAccountId);
    }
  }, [storefrontId, myMapping?.stripeAccountId]);

  // ── Handler: Create connected account ────────────────────────────────────
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !contactEmail) {
      toast.error("Please fill in both fields");
      return;
    }

    setIsCreatingAccount(true);
    try {
      const result = await createAccount({ displayName, contactEmail });
      toast.success("Connect Account V2 successfully created!");
      // Immediately fetch status to sync DB
      await handleRefreshStatus(result.stripeAccountId);
    } catch (err: any) {
      toast.error(err.message || "Failed to create account");
    } finally {
      setIsCreatingAccount(false);
    }
  };

  // ── Handler: Generate and redirect to Stripe onboarding link ────────────
  const handleStartOnboarding = async (accountId: string) => {
    setIsOnboarding(true);
    try {
      const result = await getOnboardingLink({ stripeAccountId: accountId });
      toast.loading("Redirecting to Stripe Verification Portal...");
      window.location.href = result.url;
    } catch (err: any) {
      toast.error(err.message || "Failed to get onboarding link");
      setIsOnboarding(false);
    }
  };

  // ── Handler: Query live status from Stripe API ───────────────────────────
  const handleRefreshStatus = async (accountId: string) => {
    setIsRefreshingStatus(true);
    try {
      const status = await getAccountStatus({ stripeAccountId: accountId });
      setApiStatus({
        readyToProcessPayments: status.readyToProcessPayments,
        requirementsStatus: status.requirementsStatus,
        onboardingComplete: status.onboardingComplete,
        stripeAccountStatus: status.stripeAccountStatus,
      });
      toast.success("Status synced with Stripe API!");
    } catch (err: any) {
      toast.error(err.message || "Failed to retrieve status");
    } finally {
      setIsRefreshingStatus(false);
    }
  };

  // ── Handler: Create product on Connected Account ─────────────────────────
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const accountId = myMapping?.stripeAccountId;
    if (!accountId) return;

    if (!prodName || !prodPriceUSD) {
      toast.error("Product name and price are required");
      return;
    }

    const priceCents = Math.round(parseFloat(prodPriceUSD) * 100);
    if (isNaN(priceCents) || priceCents <= 0) {
      toast.error("Please enter a valid price greater than 0");
      return;
    }

    setIsCreatingProduct(true);
    try {
      await createProduct({
        stripeAccountId: accountId,
        name: prodName,
        description: prodDesc,
        priceInCents: priceCents,
        currency: "usd",
      });
      toast.success("Product successfully created on your connected account!");
      setProdName("");
      setProdDesc("");
      setProdPriceUSD("");
      // Reload products
      await handleLoadProducts(accountId);
    } catch (err: any) {
      toast.error(err.message || "Failed to create product");
    } finally {
      setIsCreatingProduct(false);
    }
  };

  // ── Handler: Load products ───────────────────────────────────────────────
  const handleLoadProducts = async (accountId: string) => {
    setIsLoadingProducts(true);
    try {
      const list = await listProducts({ stripeAccountId: accountId });
      setProducts(list);
    } catch (err: any) {
      console.error(err);
      toast.error("Could not fetch products from Stripe.");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // ── Handler: Buy product (Checkout Session) ──────────────────────────────
  const handleBuyProduct = async (priceId: string, accountId: string) => {
    setIsCheckingOut(priceId);
    try {
      toast.loading("Initiating Direct Charge hosted Checkout Session...");
      const session = await createCheckoutSession({
        stripeAccountId: accountId,
        priceId,
        quantity: 1,
      });
      // Redirect to Stripe checkout
      window.location.href = session.url;
    } catch (err: any) {
      toast.error(err.message || "Checkout session failed");
      setIsCheckingOut(null);
    }
  };

  // ── View A: Storefront View (?storefront=acct_***) ────────────────────────
  if (storefrontId) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center py-12 px-4 sm:px-6">
        <div className="max-w-4xl w-full">
          {/* Back button to return to dashboard */}
          <button
            onClick={() => setSearchParams({})}
            className="flex items-center space-x-2 text-indigo-400 hover:text-indigo-300 mb-8 font-medium transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back to Creator Dashboard</span>
          </button>

          {/* Comment for Developers (Requested by the prompt) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-8 text-xs text-slate-400 leading-relaxed flex items-start space-x-3">
            <Info className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-300">Developer Note: </span>
              In this demo storefront page, we are identifying the store using the raw Stripe Connected Account ID in the URL parameter 
              (<code className="bg-slate-950 px-1 py-0.5 rounded text-indigo-300">?storefront={storefrontId}</code>). 
              For a production system, you should map these accounts to a secure, user-friendly identifier in your database (like a username, user ID, or slug) 
              rather than exposing raw Stripe account IDs in client-facing URLs.
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden mb-12">
            <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div>
                <span className="bg-indigo-500/15 text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center w-fit mb-3">
                  <Store className="h-3 w-3 mr-1" /> Storefront
                </span>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Connected Store</h1>
                <p className="text-slate-400 text-sm">
                  Welcome! This merchant utilizes Stripe Connect V2 to process payments securely.
                </p>
              </div>
              <div className="text-slate-400 text-xs bg-slate-950/50 border border-slate-800 px-3.5 py-2.5 rounded-lg flex flex-col gap-1">
                <div>Merchant Account:</div>
                <code className="text-indigo-300 font-mono text-xs">{storefrontId}</code>
              </div>
            </div>

            <div className="border-t border-slate-800/80 pt-8">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <ShoppingBag className="h-5 w-5 mr-2 text-indigo-400" /> Available Products
              </h2>

              {isLoadingProducts ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                  <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                  <p className="text-sm text-slate-400">Loading products from connected Stripe account...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-16 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                  <Package className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 font-medium">No products available in this store</p>
                  <p className="text-sm text-slate-500 mt-1">
                    The owner has not created any products yet, or the account is pending onboarding.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {products.map((prod) => (
                    <div 
                      key={prod.id} 
                      className="bg-slate-950/50 border border-slate-800 rounded-xl p-6 flex flex-col justify-between hover:border-slate-700 transition duration-200"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3 className="font-bold text-lg text-white">{prod.name}</h3>
                          <span className="text-xl font-extrabold text-indigo-400 shrink-0">
                            ${(prod.priceInCents / 100).toFixed(2)}
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm mb-6 line-clamp-3">
                          {prod.description || "No description provided."}
                        </p>
                      </div>

                      <button
                        onClick={() => handleBuyProduct(prod.priceId, storefrontId)}
                        disabled={isCheckingOut !== null}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center space-x-2 transition disabled:opacity-50"
                      >
                        {isCheckingOut === prod.priceId ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <span>Buy Product</span>
                            <ChevronRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── View B: Creator-facing Connect V2 Dashboard View ─────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center py-12 px-4 sm:px-6">
      <div className="max-w-4xl w-full">
        {/* Page Header */}
        <div className="mb-10 text-center md:text-left">
          <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1.5 rounded-full text-indigo-300 text-xs font-semibold mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Stripe Connect V2 Sandbox</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-3">
            Connect V2 Integration Playground
          </h1>
          <p className="text-slate-400 max-w-2xl text-sm leading-relaxed">
            This module showcases a modern, robust implementation of Stripe Connect’s new 
            <span className="text-indigo-400 font-semibold"> V2 Core Accounts API</span>. Learn how to onboard accounts, 
            retrieve live verification state, host products, charge customers via Direct Charges, and listen for Thin Webhooks.
          </p>
        </div>

        {/* LOADING STATE */}
        {myMapping === undefined ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
            <p className="text-sm text-slate-400">Loading your profile details...</p>
          </div>
        ) : !myMapping ? (
          // ── STATE 1: NO CONNECT ACCOUNT YET (FORM) ──
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl max-w-xl mx-auto">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center">
              <Store className="h-5 w-5 mr-2 text-indigo-400" /> Let's Get Set Up
            </h2>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Create a newly designed Connect Account using Stripe's V2 API. 
              This will automatically map the Stripe Connected Account to your profile in our local database.
            </p>

            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Display / Merchant Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. My Custom Shop"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-3.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Contact / Business Email
                </label>
                <input
                  type="email"
                  placeholder="e.g. shop@example.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-3.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition text-sm"
                  required
                />
              </div>

              <div className="text-xs text-slate-500 bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 leading-relaxed mb-4">
                <span className="font-semibold text-slate-400">Technical Detail:</span> Under the hood, this will issue a V2 POST request to 
                <code className="text-indigo-400 ml-1 font-mono">/v2/core/accounts</code> with custom configuration options (no top-level account types!).
              </div>

              <button
                type="submit"
                disabled={isCreatingAccount}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isCreatingAccount ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Connected Account</span>
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          // ── STATE 2: CONNECT ACCOUNT EXISTS ──
          <div className="space-y-8">
            
            {/* ACCOUNT MANAGEMENT & STATUS SUMMARY */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-slate-800/80 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">{myMapping.displayName}</h2>
                  <p className="text-slate-400 text-sm">{myMapping.contactEmail}</p>
                </div>
                <div className="flex flex-col sm:items-end gap-1.5 text-xs text-slate-400">
                  <div className="flex items-center space-x-1.5">
                    <span>Stripe Account:</span>
                    <code className="text-indigo-400 font-mono">{myMapping.stripeAccountId}</code>
                  </div>
                  <div>Mapped since: {new Date(myMapping.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              {/* LIVE ONBOARDING STATUS FROM STRIPE */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Live Stripe Verification Status
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Status Box */}
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex items-start space-x-3">
                    <div className="mt-0.5">
                      {myMapping.stripeAccountStatus === "active" ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-amber-500" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-200">Local DB Status</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Mapped account is locally tagged as:
                      </div>
                      <span className={`inline-block mt-2 text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase ${
                        myMapping.stripeAccountStatus === "active" 
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25" 
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/25"
                      }`}>
                        {myMapping.stripeAccountStatus}
                      </span>
                    </div>
                  </div>

                  {/* API Direct Box */}
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex items-start space-x-3">
                    <div className="mt-0.5">
                      {apiStatus?.onboardingComplete ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-slate-500" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-200">Stripe API Status</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Fetched live from Stripe:
                      </div>
                      <div className="text-xs text-slate-300 mt-2 space-y-1">
                        <div>Ready to process: <span className="font-bold">{apiStatus ? (apiStatus.readyToProcessPayments ? "Yes" : "No") : "Unknown"}</span></div>
                        <div>Requirements: <span className="font-mono bg-slate-900 px-1 py-0.5 rounded text-indigo-300">{apiStatus ? apiStatus.requirementsStatus : "Unknown"}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS FOR ONBOARDING */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => handleStartOnboarding(myMapping.stripeAccountId)}
                  disabled={isOnboarding}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-lg flex items-center space-x-2 transition text-sm disabled:opacity-50"
                >
                  {isOnboarding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="h-4 w-4" />
                  )}
                  <span>Onboard to Collect Payments</span>
                </button>

                <button
                  onClick={() => handleRefreshStatus(myMapping.stripeAccountId)}
                  disabled={isRefreshingStatus}
                  className="bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-800 font-semibold py-2 px-4 rounded-lg flex items-center space-x-2 transition text-sm disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshingStatus ? "animate-spin" : ""}`} />
                  <span>Verify Status Live</span>
                </button>

                {myMapping.stripeAccountStatus === "active" && (
                  <button
                    onClick={() => setSearchParams({ storefront: myMapping.stripeAccountId })}
                    className="bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 font-semibold py-2 px-4 rounded-lg flex items-center space-x-2 transition text-sm"
                  >
                    <Store className="h-4 w-4" />
                    <span>View Storefront</span>
                  </button>
                )}
              </div>
            </div>

            {/* PRODUCT CREATION PANEL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Product Create Form */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <Plus className="h-5 w-5 mr-2 text-indigo-400" /> Create a New Product
                </h3>

                <form onSubmit={handleCreateProduct} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Product Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Premium Activist Tee"
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      placeholder="Describe what your customers are buying..."
                      value={prodDesc}
                      onChange={(e) => setProdDesc(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition text-sm min-h-20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Price (USD)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-500 text-sm">
                        <DollarSign className="h-4 w-4" />
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="19.99"
                        value={prodPriceUSD}
                        onChange={(e) => setProdPriceUSD(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-9 pr-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 bg-slate-950/60 p-3 rounded-lg border border-slate-850">
                    Creates the product on your mapped Stripe Connected Account via the 
                    <code className="text-indigo-400 ml-1 font-mono">Stripe-Account</code> header.
                  </div>

                  <button
                    type="submit"
                    disabled={isCreatingProduct}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center space-x-2 disabled:opacity-50 text-sm"
                  >
                    {isCreatingProduct ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Package className="h-4 w-4" />
                    )}
                    <span>Create Product</span>
                  </button>
                </form>
              </div>

              {/* Storefront Products Preview */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center">
                      <ShoppingBag className="h-5 w-5 mr-2 text-indigo-400" /> Storefront Products
                    </h3>
                    <button 
                      onClick={() => handleLoadProducts(myMapping.stripeAccountId)}
                      className="text-indigo-400 hover:text-indigo-300"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>

                  {isLoadingProducts ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-2">
                      <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
                      <p className="text-xs text-slate-400">Loading your store...</p>
                    </div>
                  ) : products.length === 0 ? (
                    <div className="text-center py-12 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                      <Package className="h-10 w-10 text-slate-600 mx-auto mb-2" />
                      <p className="text-slate-400 text-xs font-semibold">Your store is empty</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Use the form to create your first item on Stripe!</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {products.map((p) => (
                        <div key={p.id} className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between">
                          <div className="min-w-0 pr-2">
                            <div className="font-semibold text-slate-200 text-sm truncate">{p.name}</div>
                            <div className="text-xs text-slate-500 truncate">{p.description || "No description"}</div>
                          </div>
                          <div className="text-sm font-bold text-indigo-400 text-right shrink-0">
                            ${(p.priceInCents / 100).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-800/80 pt-4 mt-4">
                  <div className="text-xs text-slate-400 leading-relaxed mb-4">
                    Want to preview what your storefront looks like to customers? Open your custom share link below!
                  </div>
                  
                  <button
                    onClick={() => setSearchParams({ storefront: myMapping.stripeAccountId })}
                    disabled={myMapping.stripeAccountStatus !== "active"}
                    className="w-full bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-800 font-semibold py-2 rounded-lg transition flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
                  >
                    <Store className="h-4 w-4" />
                    <span>View Customer Storefront</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default StripeConnectV2Sample;
