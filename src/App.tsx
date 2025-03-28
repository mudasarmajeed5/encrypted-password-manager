import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, Copy, RefreshCw, Save, LogOut } from 'lucide-react';
import { supabase } from './lib/supabase';
import { generatePassword, encryptPassword, decryptPassword } from './lib/encryption';
import toast, { Toaster } from 'react-hot-toast';

interface SavedPassword {
  id: string;
  title: string;
  encrypted_password: string;
  created_at: string;
}

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [passwordLength, setPasswordLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [savedPasswords, setSavedPasswords] = useState<SavedPassword[]>([]);
  const [passwordTitle, setPasswordTitle] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session) fetchSavedPasswords();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchSavedPasswords();
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchSavedPasswords = async () => {
    const { data, error } = await supabase
      .from('passwords')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Error fetching passwords');
      return;
    }

    setSavedPasswords(data || []);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      toast.success('Logged in successfully!');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      toast.success('Check your email for verification link!');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out successfully!');
  };

  const handleGeneratePassword = () => {
    const newPassword = generatePassword(
      passwordLength,
      includeUppercase,
      includeLowercase,
      includeNumbers,
      includeSymbols
    );
    setGeneratedPassword(newPassword);
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
    toast.success('Password copied to clipboard!');
  };

  const handleSavePassword = async () => {
    if (!passwordTitle || !generatedPassword) {
      toast.error('Please provide both title and generate a password');
      return;
    }

    try {
      const encryptedPass = encryptPassword(generatedPassword, session.user.id);
      const { error } = await supabase.from('passwords').insert([
        {
          title: passwordTitle,
          encrypted_password: encryptedPass,
          user_id: session.user.id,
        },
      ]);

      if (error) throw error;

      toast.success('Password saved successfully!');
      setPasswordTitle('');
      setGeneratedPassword('');
      fetchSavedPasswords();
    } catch (error: any) {
      toast.error('Error saving password');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <div className="flex items-center justify-center mb-8">
            <Lock className="w-12 h-12 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-center mb-6">Secure Password Manager</h2>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-500"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-200"
              >
                Login
              </button>
              <button
                type="button"
                onClick={handleSignUp}
                className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition duration-200"
              >
                Sign Up
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Password Generator & Manager</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition duration-200"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Generate Password</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password Length: {passwordLength}
              </label>
              <input
                type="range"
                min="8"
                max="32"
                value={passwordLength}
                onChange={(e) => setPasswordLength(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={includeUppercase}
                  onChange={(e) => setIncludeUppercase(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span>Uppercase Letters</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={includeLowercase}
                  onChange={(e) => setIncludeLowercase(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span>Lowercase Letters</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={includeNumbers}
                  onChange={(e) => setIncludeNumbers(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span>Numbers</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={includeSymbols}
                  onChange={(e) => setIncludeSymbols(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span>Symbols</span>
              </label>
            </div>
          </div>

          <div className="flex gap-4 items-center mb-6">
            <button
              onClick={handleGeneratePassword}
              className="flex items-center gap-2 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-200"
            >
              <RefreshCw size={20} />
              Generate
            </button>
            {generatedPassword && (
              <>
                <div className="flex-1 bg-gray-100 p-2 rounded-md font-mono">
                  {generatedPassword}
                </div>
                <button
                  onClick={handleCopyPassword}
                  className="flex items-center gap-2 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition duration-200"
                >
                  <Copy size={20} />
                  Copy
                </button>
              </>
            )}
          </div>

          <div className="flex gap-4 items-center">
            <input
              type="text"
              value={passwordTitle}
              onChange={(e) => setPasswordTitle(e.target.value)}
              placeholder="Enter password title"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleSavePassword}
              className="flex items-center gap-2 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition duration-200"
            >
              <Save size={20} />
              Save Password
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Saved Passwords</h2>
          <div className="space-y-4">
            {savedPasswords.map((savedPassword) => (
              <div
                key={savedPassword.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <span className="font-medium">{savedPassword.title}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const decrypted = decryptPassword(
                        savedPassword.encrypted_password,
                        session.user.id
                      );
                      navigator.clipboard.writeText(decrypted);
                      toast.success('Password copied to clipboard!');
                    }}
                    className="flex items-center gap-1 bg-gray-200 text-gray-800 py-1 px-3 rounded-md hover:bg-gray-300 transition duration-200"
                  >
                    <Copy size={16} />
                    Copy
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;