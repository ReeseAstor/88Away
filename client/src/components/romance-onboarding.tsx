import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Heart, BookOpen, Users, TrendingUp, Sparkles, ArrowRight, ArrowLeft, Check } from 'lucide-react';

interface OnboardingData {
  userType: 'author' | 'publisher' | 'agency' | '';
  experience: 'beginner' | 'intermediate' | 'expert' | '';
  genres: string[];
  writingGoals: string[];
  preferredTropes: string[];
  heatLevel: string;
  publishingExperience: boolean;
  teamSize?: number;
  clientCount?: number;
  interests: string[];
}

const ROMANCE_GENRES = [
  'Contemporary', 'Historical', 'Paranormal', 'Fantasy', 'Sci-Fi', 
  'Suspense', 'Military', 'Sports', 'Billionaire', 'Small Town',
  'Motorcycle Club', 'Mafia', 'Rockstar', 'Medical', 'Western'
];

const POPULAR_TROPES = [
  'enemies-to-lovers', 'friends-to-lovers', 'fake-dating', 'second-chance',
  'arranged-marriage', 'age-gap', 'single-parent', 'workplace-romance',
  'forbidden-love', 'love-triangle', 'instalove', 'slow-burn',
  'grumpy-sunshine', 'opposites-attract', 'forced-proximity'
];

const WRITING_GOALS = [
  'Write my first romance novel', 'Complete a romance series', 
  'Improve my writing craft', 'Increase publishing speed',
  'Build a reader following', 'Maximize revenue', 
  'Explore new subgenres', 'Master romance tropes'
];

const HEAT_LEVELS = [
  { value: 'sweet', label: 'Sweet', description: 'No explicit content, focus on emotional connection' },
  { value: 'steamy', label: 'Steamy', description: 'Some heat with fade-to-black scenes' },
  { value: 'spicy', label: 'Spicy', description: 'Explicit romantic scenes with detailed descriptions' }
];

interface RomanceOnboardingProps {
  onComplete: (data: OnboardingData) => void;
  onSkip: () => void;
}

export function RomanceOnboarding({ onComplete, onSkip }: RomanceOnboardingProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    userType: '',
    experience: '',
    genres: [],
    writingGoals: [],
    preferredTropes: [],
    heatLevel: '',
    publishingExperience: false,
    interests: []
  });

  const totalSteps = 6;
  const progress = (step / totalSteps) * 100;

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onComplete(data);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item) 
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  const canProceed = () => {
    switch (step) {
      case 1: return data.userType !== '';
      case 2: return data.experience !== '';
      case 3: return data.genres.length > 0;
      case 4: return data.writingGoals.length > 0;
      case 5: return data.heatLevel !== '';
      case 6: return true;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl border-rose-200">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <Heart className="h-8 w-8 text-rose-500" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-500 to-purple-600 bg-clip-text text-transparent">
              Welcome to Romance Platform
            </h1>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-gray-600">Step {step} of {totalSteps}</p>
        </CardHeader>

        <CardContent className="space-y-6">
          <AnimatePresence mode="wait">
            {/* Step 1: User Type */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">Tell us about yourself</h2>
                  <p className="text-gray-600">How do you plan to use our romance platform?</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { type: 'author', icon: BookOpen, title: 'Romance Author', desc: 'Write and publish romance novels' },
                    { type: 'publisher', icon: TrendingUp, title: 'Publisher', desc: 'Manage multiple romance projects' },
                    { type: 'agency', icon: Users, title: 'Literary Agency', desc: 'Represent romance authors' },
                  ].map(({ type, icon: Icon, title, desc }) => (
                    <Card 
                      key={type}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        data.userType === type ? 'ring-2 ring-rose-500 bg-rose-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => updateData({ userType: type as any })}
                    >
                      <CardContent className="p-6 text-center">
                        <Icon className={`h-12 w-12 mx-auto mb-3 ${
                          data.userType === type ? 'text-rose-500' : 'text-gray-400'
                        }`} />
                        <h3 className="font-semibold text-gray-800">{title}</h3>
                        <p className="text-sm text-gray-600">{desc}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Experience Level */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">Your Romance Writing Experience</h2>
                  <p className="text-gray-600">This helps us customize your experience</p>
                </div>
                
                <div className="space-y-4">
                  {[
                    { level: 'beginner', title: 'Just Starting Out', desc: 'New to romance writing, learning the basics' },
                    { level: 'intermediate', title: 'Some Experience', desc: 'Written some romance, familiar with tropes' },
                    { level: 'expert', title: 'Experienced Writer', desc: 'Published romance author or industry professional' }
                  ].map(({ level, title, desc }) => (
                    <Card 
                      key={level}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        data.experience === level ? 'ring-2 ring-rose-500 bg-rose-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => updateData({ experience: level as any })}
                    >
                      <CardContent className="p-4 flex items-center space-x-4">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          data.experience === level 
                            ? 'bg-rose-500 border-rose-500' 
                            : 'border-gray-300'
                        }`} />
                        <div>
                          <h3 className="font-semibold text-gray-800">{title}</h3>
                          <p className="text-sm text-gray-600">{desc}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Romance Genres */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">Favorite Romance Genres</h2>
                  <p className="text-gray-600">Select all that interest you (choose at least one)</p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {ROMANCE_GENRES.map(genre => (
                    <Badge
                      key={genre}
                      variant={data.genres.includes(genre) ? "default" : "outline"}
                      className={`cursor-pointer p-3 text-center justify-center ${
                        data.genres.includes(genre) 
                          ? 'bg-rose-500 hover:bg-rose-600' 
                          : 'hover:bg-rose-50 hover:border-rose-300'
                      }`}
                      onClick={() => updateData({ 
                        genres: toggleArrayItem(data.genres, genre) 
                      })}
                    >
                      {genre}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 4: Writing Goals */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">Your Romance Writing Goals</h2>
                  <p className="text-gray-600">What do you want to achieve? (select all that apply)</p>
                </div>
                
                <div className="space-y-3">
                  {WRITING_GOALS.map(goal => (
                    <div key={goal} className="flex items-center space-x-3">
                      <Checkbox
                        id={goal}
                        checked={data.writingGoals.includes(goal)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateData({ writingGoals: [...data.writingGoals, goal] });
                          } else {
                            updateData({ writingGoals: data.writingGoals.filter(g => g !== goal) });
                          }
                        }}
                      />
                      <Label htmlFor={goal} className="text-gray-700 cursor-pointer">
                        {goal}
                      </Label>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 5: Heat Level Preference */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">Preferred Heat Level</h2>
                  <p className="text-gray-600">What level of romantic content do you prefer to write/publish?</p>
                </div>
                
                <div className="space-y-4">
                  {HEAT_LEVELS.map(({ value, label, description }) => (
                    <Card 
                      key={value}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        data.heatLevel === value ? 'ring-2 ring-rose-500 bg-rose-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => updateData({ heatLevel: value })}
                    >
                      <CardContent className="p-4 flex items-center space-x-4">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          data.heatLevel === value 
                            ? 'bg-rose-500 border-rose-500' 
                            : 'border-gray-300'
                        }`} />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{label}</h3>
                          <p className="text-sm text-gray-600">{description}</p>
                        </div>
                        {value === 'sweet' && <span className="text-2xl">💕</span>}
                        {value === 'steamy' && <span className="text-2xl">🔥</span>}
                        {value === 'spicy' && <span className="text-2xl">🌶️</span>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 6: Additional Preferences */}
            {step === 6 && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">Almost Done!</h2>
                  <p className="text-gray-600">Just a few more details to personalize your experience</p>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-medium text-gray-700 mb-3 block">
                      Favorite Romance Tropes (optional)
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {POPULAR_TROPES.slice(0, 12).map(trope => (
                        <Badge
                          key={trope}
                          variant={data.preferredTropes.includes(trope) ? "default" : "outline"}
                          className={`cursor-pointer p-2 text-xs text-center justify-center ${
                            data.preferredTropes.includes(trope) 
                              ? 'bg-rose-500 hover:bg-rose-600' 
                              : 'hover:bg-rose-50 hover:border-rose-300'
                          }`}
                          onClick={() => updateData({ 
                            preferredTropes: toggleArrayItem(data.preferredTropes, trope) 
                          })}
                        >
                          {trope.replace('-', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="publishing-experience"
                      checked={data.publishingExperience}
                      onCheckedChange={(checked) => 
                        updateData({ publishingExperience: checked as boolean })
                      }
                    />
                    <Label htmlFor="publishing-experience" className="text-gray-700 cursor-pointer">
                      I have experience with publishing platforms (KDP, etc.)
                    </Label>
                  </div>
                  
                  {data.userType === 'agency' && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="client-count" className="text-sm font-medium text-gray-700">
                          Approximate number of clients
                        </Label>
                        <Input
                          id="client-count"
                          type="number"
                          placeholder="e.g. 15"
                          value={data.clientCount || ''}
                          onChange={(e) => updateData({ clientCount: parseInt(e.target.value) || 0 })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  )}
                  
                  {data.userType === 'publisher' && (
                    <div>
                      <Label htmlFor="team-size" className="text-sm font-medium text-gray-700">
                        Team size
                      </Label>
                      <Input
                        id="team-size"
                        type="number"
                        placeholder="e.g. 5"
                        value={data.teamSize || ''}
                        onChange={(e) => updateData({ teamSize: parseInt(e.target.value) || 0 })}
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>

        <CardFooter className="flex justify-between pt-6">
          <Button 
            variant="outline" 
            onClick={step === 1 ? onSkip : prevStep}
            className="flex items-center space-x-2"
          >
            {step === 1 ? (
              <>Skip Setup</>
            ) : (
              <>
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </>
            )}
          </Button>
          
          <Button 
            onClick={nextStep}
            disabled={!canProceed()}
            className="bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 flex items-center space-x-2"
          >
            {step === totalSteps ? (
              <>
                <Check className="h-4 w-4" />
                <span>Complete Setup</span>
              </>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Welcome message component shown after onboarding
export function RomanceWelcomeMessage({ userData }: { userData: OnboardingData }) {
  const getPersonalizedMessage = () => {
    const { userType, experience, genres, heatLevel } = userData;
    
    let message = `Welcome to the Romance Platform! `;
    
    if (userType === 'author') {
      message += `As a ${experience} romance author interested in ${genres[0]?.toLowerCase()} romance, `;
    } else if (userType === 'publisher') {
      message += `As a romance publisher, `;
    } else {
      message += `As a literary agency, `;
    }
    
    message += `you'll have access to specialized AI assistants, trope management tools, and publishing pipeline features. `;
    
    if (heatLevel) {
      message += `We've set up your workspace for ${heatLevel} romance content. `;
    }
    
    message += `Let's start creating amazing romance stories together!`;
    
    return message;
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center p-6 bg-gradient-to-r from-rose-50 to-purple-50 rounded-lg border border-rose-200"
    >
      <Sparkles className="h-12 w-12 text-rose-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-800 mb-3">Setup Complete!</h2>
      <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
        {getPersonalizedMessage()}
      </p>
      <div className="mt-6 flex justify-center space-x-4">
        <Button className="bg-gradient-to-r from-rose-500 to-purple-600">
          Create Your First Project
        </Button>
        <Button variant="outline">
          Explore Features
        </Button>
      </div>
    </motion.div>
  );
}