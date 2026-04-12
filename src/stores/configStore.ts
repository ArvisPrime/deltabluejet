import { create } from 'zustand';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { 
    FareClassConfig, 
    AncillaryCatalogConfig, 
    BaggageRulesConfig, 
    PaymentProvidersConfig,
    AircraftLayoutConfig,
    CountryConfig
} from '../types/configTypes';

interface ConfigState {
    fares: FareClassConfig | null;
    ancillaries: AncillaryCatalogConfig | null;
    baggage: BaggageRulesConfig | null;
    paymentProviders: PaymentProvidersConfig | null;
    countries: CountryConfig | null;
    aircraftLayouts: Record<string, AircraftLayoutConfig>;
    
    // Status
    isLoading: boolean;
    error: string | null;

    // Actions
    initializeConfigs: () => () => void; // Returns unsubscribe function
    fetchAircraftLayout: (layoutId: string) => Promise<AircraftLayoutConfig | null>;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
    fares: null,
    ancillaries: null,
    baggage: null,
    paymentProviders: null,
    countries: null,
    aircraftLayouts: {},
    
    isLoading: true,
    error: null,

    initializeConfigs: () => {
        set({ isLoading: true, error: null });

        // Listeners
        const unsubFares = onSnapshot(doc(db, 'system_configs', 'fare_classes'), (doc) => {
            if (doc.exists()) set({ fares: doc.data() as FareClassConfig });
        }, (err) => console.error("Error loading fares config:", err));

        const unsubBaggage = onSnapshot(doc(db, 'system_configs', 'baggage_rules'), (doc) => {
            if (doc.exists()) set({ baggage: doc.data() as BaggageRulesConfig });
        }, (err) => console.error("Error loading baggage config:", err));

        const unsubAncillaries = onSnapshot(doc(db, 'system_configs', 'ancillaries'), (doc) => {
            if (doc.exists()) set({ ancillaries: doc.data() as AncillaryCatalogConfig });
        }, (err) => console.error("Error loading ancillaries config:", err));

        const unsubPayments = onSnapshot(doc(db, 'system_configs', 'payment_providers'), (doc) => {
            if (doc.exists()) set({ paymentProviders: doc.data() as PaymentProvidersConfig });
        }, (err) => console.error("Error loading payments config:", err));

        const unsubCountries = onSnapshot(doc(db, 'system_configs', 'countries'), (doc) => {
            if (doc.exists()) set({ countries: doc.data() as CountryConfig });
        }, (err) => console.error("Error loading countries config:", err));

        set({ isLoading: false });

        return () => {
            unsubFares();
            unsubBaggage();
            unsubAncillaries();
            unsubPayments();
            unsubCountries();
        };
    },

    fetchAircraftLayout: async (layoutId: string) => {
        const { aircraftLayouts } = get();
        if (aircraftLayouts[layoutId]) {
            return aircraftLayouts[layoutId];
        }

        try {
            const layoutDoc = await getDoc(doc(db, 'aircraft_layouts', layoutId));
            if (layoutDoc.exists()) {
                const layoutData = layoutDoc.data() as AircraftLayoutConfig;
                set((state) => ({ aircraftLayouts: { ...state.aircraftLayouts, [layoutId]: layoutData }}));
                return layoutData;
            }
            return null;
        } catch (err) {
            console.error("Error fetching aircraft layout:", layoutId, err);
            return null;
        }
    }
}));
