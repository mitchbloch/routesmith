'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Nav from '@/components/Nav';
import WizardStep from '@/components/WizardStep';
import OptionSelector from '@/components/OptionSelector';
import DistanceSlider from '@/components/DistanceSlider';
import { reverseGeocode } from '@/lib/geocoding';
import type { ActivityType, RouteType, ElevationPreference, SceneryPreference, SafetyPreference, DistanceUnit } from '@/lib/types';
import { ACTIVITY_DEFAULTS } from '@/lib/types';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });
const AddressSearch = dynamic(() => import('@/components/AddressSearch'), { ssr: false });

export default function WizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [activity, setActivity] = useState<ActivityType>('running');
  const [routeType, setRouteType] = useState<RouteType>('loop');
  const [endLocation, setEndLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [endMarker, setEndMarker] = useState<[number, number] | null>(null);
  const [distMin, setDistMin] = useState(2);
  const [distMax, setDistMax] = useState(6);
  const [unit, setUnit] = useState<DistanceUnit>('miles');
  const [elevation, setElevation] = useState<ElevationPreference>('moderate');
  const [scenery, setScenery] = useState<SceneryPreference[]>(['no-preference']);
  const [safety, setSafety] = useState<SafetyPreference[]>(['no-preference']);
  const [startCenter] = useState<[number, number]>(() => {
    if (typeof window === 'undefined') return [-71.0589, 42.3601];
    try {
      const start = sessionStorage.getItem('routesmith_start');
      if (start) {
        const parsed = JSON.parse(start);
        if (parsed.lng && parsed.lat) return [parsed.lng, parsed.lat];
      }
    } catch {
      // use default
    }
    return [-71.0589, 42.3601];
  });

  const isP2P = routeType === 'point-to-point';
  const totalSteps = isP2P ? 7 : 6;

  useEffect(() => {
    const start = sessionStorage.getItem('routesmith_start');
    if (!start) {
      router.replace('/');
    }
  }, [router]);

  useEffect(() => {
    const defaults = ACTIVITY_DEFAULTS[activity];
    setDistMin(defaults.minDist);
    setDistMax(defaults.maxDist);
  }, [activity]);

  const handleEndLocationSelect = (lat: number, lng: number, address?: string) => {
    setEndLocation({ lat, lng, address });
    setEndMarker([lng, lat]);

    if (!address) {
      reverseGeocode(lat, lng).then((resolved) => {
        if (resolved) {
          setEndLocation((prev) => prev && prev.lat === lat && prev.lng === lng ? { ...prev, address: resolved } : prev);
        }
      });
    }
  };

  const handleFinish = () => {
    const start = JSON.parse(sessionStorage.getItem('routesmith_start') || '{}');
    const prefs: Record<string, unknown> = {
      startLocation: start,
      activityType: activity,
      routeType,
      distanceMin: distMin,
      distanceMax: distMax,
      distanceUnit: unit,
      elevation,
      scenery,
      safety,
    };
    if (isP2P && endLocation) {
      prefs.endLocation = endLocation;
    }
    sessionStorage.setItem('routesmith_prefs', JSON.stringify(prefs));
    sessionStorage.removeItem('routesmith_routes');
    router.push('/results');
  };

  const back = () => setStep(s => s - 1);
  const next = () => setStep(s => s + 1);

  const maxSlider = activity === 'biking' ? 50 : activity === 'running' ? 20 : 10;

  // Map logical step to content. For P2P, step 3 is the destination picker.
  // For loop, steps 3-6 are distance/elevation/scenery/safety.
  // For P2P, steps 4-7 are distance/elevation/scenery/safety.
  const getLogicalStep = (): string => {
    if (step === 1) return 'activity';
    if (step === 2) return 'routeType';
    if (isP2P && step === 3) return 'destination';
    const offset = isP2P ? 1 : 0;
    const adjusted = step - offset;
    if (adjusted === 3) return 'distance';
    if (adjusted === 4) return 'elevation';
    if (adjusted === 5) return 'scenery';
    if (adjusted === 6) return 'safety';
    return 'unknown';
  };

  const logicalStep = getLogicalStep();

  const stepContent = (() => {
    switch (logicalStep) {
    case 'activity':
      return (
        <WizardStep step={1} totalSteps={totalSteps} title="What's your activity?" onNext={next}>
          <OptionSelector
            value={activity}
            onChange={(v) => setActivity(v as ActivityType)}
            options={[
              { value: 'walking', label: 'Walking', icon: '🚶', description: 'Casual pace, enjoy the scenery' },
              { value: 'running', label: 'Running', icon: '🏃', description: 'Get your heart rate up' },
              { value: 'biking', label: 'Biking', icon: '🚴', description: 'Cover more ground' },
            ]}
          />
        </WizardStep>
      );
    case 'routeType':
      return (
        <WizardStep step={2} totalSteps={totalSteps} title="What type of route?" onBack={back} onNext={next}>
          <OptionSelector
            value={routeType}
            onChange={(v) => setRouteType(v as RouteType)}
            options={[
              { value: 'loop', label: 'Loop', icon: '🔄', description: 'Start and end at the same spot' },
              { value: 'point-to-point', label: 'Point to Point', icon: '📍', description: 'Go from A to B' },
            ]}
          />
        </WizardStep>
      );
    case 'destination':
      return (
        <WizardStep
          step={3}
          totalSteps={totalSteps}
          title="Where are you going?"
          subtitle="Search or tap the map to set your destination"
          onBack={back}
          onNext={next}
          canContinue={!!endLocation}
        >
          <div className="space-y-3">
            <AddressSearch
              onResult={(lat, lng, address) => handleEndLocationSelect(lat, lng, address)}
              placeholder="Search for destination…"
              proximity={startCenter}
            />
            <div className="h-[320px] overflow-hidden border border-hairline relative">
              {/* Corner crosshairs to give the map plate a cartographic frame */}
              <span className="absolute top-0 left-0 w-3 h-3 border-l border-t border-ink z-10 pointer-events-none" aria-hidden />
              <span className="absolute top-0 right-0 w-3 h-3 border-r border-t border-ink z-10 pointer-events-none" aria-hidden />
              <span className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-ink z-10 pointer-events-none" aria-hidden />
              <span className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-ink z-10 pointer-events-none" aria-hidden />
              <Map
                onLocationSelect={(lat, lng) => handleEndLocationSelect(lat, lng)}
                center={startCenter}
                marker={endMarker}
                className="w-full h-full"
              />
            </div>
            {endLocation?.address && (
              <p className="coord-mono text-ink-soft truncate" title={endLocation.address}>
                <span className="label-mono-sm mr-2">→</span>{endLocation.address}
              </p>
            )}
          </div>
        </WizardStep>
      );
    case 'distance':
      return (
        <WizardStep step={isP2P ? 4 : 3} totalSteps={totalSteps} title="How far?" subtitle="Set your distance range" onBack={back} onNext={next}>
          <DistanceSlider
            min={0.5}
            max={maxSlider}
            valueMin={distMin}
            valueMax={distMax}
            unit={unit}
            onChangeMin={setDistMin}
            onChangeMax={setDistMax}
            onChangeUnit={setUnit}
          />
        </WizardStep>
      );
    case 'elevation':
      return (
        <WizardStep step={isP2P ? 5 : 4} totalSteps={totalSteps} title="Elevation preference?" onBack={back} onNext={next}>
          <OptionSelector
            value={elevation}
            onChange={(v) => setElevation(v as ElevationPreference)}
            options={[
              { value: 'flat', label: 'Flat', icon: '➖', description: 'Minimal elevation change' },
              { value: 'moderate', label: 'Moderate', icon: '〰️', description: 'Some hills for variety' },
              { value: 'hilly', label: 'Hilly', icon: '🏔️', description: 'Maximize elevation gain' },
              { value: 'no-preference', label: 'No Preference', icon: '🤷' },
            ]}
          />
        </WizardStep>
      );
    case 'scenery':
      return (
        <WizardStep step={isP2P ? 6 : 5} totalSteps={totalSteps} title="Scenery preference?" subtitle="Select one or more" onBack={back} onNext={next}>
          <OptionSelector
            multi
            value={scenery}
            onChange={(v) => setScenery(v as SceneryPreference[])}
            options={[
              { value: 'parks', label: 'Parks & Green Space', icon: '🌳' },
              { value: 'waterfront', label: 'Waterfront', icon: '🌊' },
              { value: 'urban', label: 'Urban Streets', icon: '🏙️' },
              { value: 'residential', label: 'Quiet Neighborhoods', icon: '🏘️' },
              { value: 'no-preference', label: 'No Preference', icon: '🤷' },
            ]}
          />
        </WizardStep>
      );
    case 'safety':
      return (
        <WizardStep
          step={totalSteps}
          totalSteps={totalSteps}
          title="Path safety?"
          subtitle="Select one or more"
          onBack={back}
          onNext={handleFinish}
          nextLabel="Generate Routes"
        >
          <OptionSelector
            multi
            value={safety}
            onChange={(v) => setSafety(v as SafetyPreference[])}
            options={[
              { value: 'dedicated-paths', label: 'Dedicated Paths', icon: '🛤️', description: 'Prefer sidewalks & bike lanes' },
              { value: 'minimize-crossings', label: 'Fewer Crossings', icon: '🚦', description: 'Minimize traffic intersections' },
              { value: 'no-preference', label: 'No Preference', icon: '🤷' },
            ]}
          />
        </WizardStep>
      );
    default:
      return null;
  }
  })();

  return (
    <>
      <Nav />
      {stepContent}
    </>
  );
}
