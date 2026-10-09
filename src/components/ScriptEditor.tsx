// components/ScriptEditor.tsx
"use client";
import { useState, useEffect } from "react";

type Transition = {
    automatic?: boolean; // If true, automatically transition without condition
    condition: string;
    if_true: number;  // State index if condition is met (or next state if automatic)
    if_false: number; // State index if condition is not met
};

type State = {
    name: string;
    goal: string;
    chat_options: string[];
    transitions: Transition[];
    is_final?: boolean;
    is_research?: boolean; // If true, use database search to compose response
};

const initialState: State = {
    name: "First Contact",
    goal: "Start the conversation, generate trust and qualify user interest",
    chat_options: [
        "Hello [name], how are you? This is Harmonic Derm. I noticed you showed interest in our treatments and I'd like to know: what transformation are you most looking for today, reducing stretch marks, softening scars, or rejuvenating?"
    ],
    transitions: [],
    is_final: false
};

export default function ScriptEditor({ agentId }: { agentId?: string }) {
    const [states, setStates] = useState<State[]>([initialState]);
    const [selectedStateIndex, setSelectedStateIndex] = useState(0);
    const [showJson, setShowJson] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [autoSaving, setAutoSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [jsonText, setJsonText] = useState("");
    const [jsonError, setJsonError] = useState("");

    // Load script from database on mount
    useEffect(() => {
        const loadScript = async () => {
            if (!agentId) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`/api/agents/${agentId}/script`);

                if (response.ok) {
                    const data = await response.json();
                    if (data.script && Array.isArray(data.script) && data.script.length > 0) {
                        setStates(data.script);
                        setSelectedStateIndex(0);
                        console.log("✅ Script loaded from database");
                    }
                }
            } catch (error) {
                console.error("Error loading script:", error);
            } finally {
                setLoading(false);
            }
        };

        loadScript();
    }, [agentId]);

    // Sync JSON text when switching to JSON view or states change
    useEffect(() => {
        if (showJson) {
            setJsonText(JSON.stringify(states, null, 2));
            setJsonError("");
        }
    }, [showJson, states]);

    // Auto-save functionality with debounce
    useEffect(() => {
        if (loading || !hasChanges || !agentId) return;

        const autoSave = async () => {
            setAutoSaving(true);
            
            try {
                const response = await fetch(`/api/agents/${agentId}/script`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ script: states }),
                });

                if (response.ok) {
                    console.log("💾 Auto-saved script");
                    setHasChanges(false);
                }
            } catch (error) {
                console.error("Error auto-saving script:", error);
            } finally {
                setAutoSaving(false);
            }
        };

        // Debounce: wait 2 seconds after last change before auto-saving
        const timeoutId = setTimeout(autoSave, 2000);

        return () => clearTimeout(timeoutId);
    }, [states, agentId, loading, hasChanges]);

    const addState = () => {
        const newState: State = {
            name: `State ${states.length}`,
            goal: "",
            chat_options: [""],
            transitions: [],
            is_final: false
        };
        setStates([...states, newState]);
        setSelectedStateIndex(states.length);
        setHasChanges(true);
    };

    const saveScript = async () => {
        if (!agentId) {
            setSaveMessage("No agent selected");
            setTimeout(() => setSaveMessage(""), 3000);
            return;
        }

        setSaving(true);
        setSaveMessage("");

        try {
            const response = await fetch(`/api/agents/${agentId}/script`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ script: states }),
            });

            if (!response.ok) {
                throw new Error("Failed to save script");
            }

            setSaveMessage("✓ Script saved successfully");
            setHasChanges(false);
            setTimeout(() => setSaveMessage(""), 3000);
        } catch (error: any) {
            console.error("Error saving script:", error);
            setSaveMessage("✗ Failed to save script");
            setTimeout(() => setSaveMessage(""), 3000);
        } finally {
            setSaving(false);
        }
    };

    const deleteState = (index: number) => {
        if (states.length === 1) return;
        const newStates = states.filter((_, i) => i !== index);
        setStates(newStates);
        setSelectedStateIndex(Math.max(0, index - 1));
        setHasChanges(true);
    };

    const updateState = (index: number, updatedState: State) => {
        const newStates = [...states];
        newStates[index] = updatedState;
        setStates(newStates);
        setHasChanges(true);
    };

    const addChatOption = () => {
        const newStates = [...states];
        newStates[selectedStateIndex].chat_options.push("");
        setStates(newStates);
        setHasChanges(true);
    };

    const updateChatOption = (optionIndex: number, value: string) => {
        const newStates = [...states];
        newStates[selectedStateIndex].chat_options[optionIndex] = value;
        setStates(newStates);
        setHasChanges(true);
    };

    const deleteChatOption = (optionIndex: number) => {
        const newStates = [...states];
        if (newStates[selectedStateIndex].chat_options.length > 1) {
            newStates[selectedStateIndex].chat_options.splice(optionIndex, 1);
            setStates(newStates);
            setHasChanges(true);
        }
    };

    const addTransition = () => {
        const newStates = [...states];
        // Add a new transition with if_true and if_false states
        newStates[selectedStateIndex].transitions.push({
            automatic: false,
            condition: "",
            if_true: 0,
            if_false: 0
        });
        setStates(newStates);
        setHasChanges(true);
    };

    const toggleTransitionAutomatic = (index: number) => {
        const newStates = [...states];
        const transition = newStates[selectedStateIndex].transitions[index];
        transition.automatic = !transition.automatic;
        setStates(newStates);
        setHasChanges(true);
    };

    const updateTransitionCondition = (index: number, condition: string) => {
        const newStates = [...states];
        newStates[selectedStateIndex].transitions[index].condition = condition;
        setStates(newStates);
        setHasChanges(true);
    };

    const updateTransitionIfTrue = (index: number, stateIndex: number) => {
        const newStates = [...states];
        newStates[selectedStateIndex].transitions[index].if_true = stateIndex;
        setStates(newStates);
        setHasChanges(true);
    };

    const updateTransitionIfFalse = (index: number, stateIndex: number) => {
        const newStates = [...states];
        newStates[selectedStateIndex].transitions[index].if_false = stateIndex;
        setStates(newStates);
        setHasChanges(true);
    };

    const deleteTransition = (index: number) => {
        const newStates = [...states];
        newStates[selectedStateIndex].transitions.splice(index, 1);
        setStates(newStates);
        setHasChanges(true);
    };

    const applyJsonChanges = () => {
        try {
            const parsedStates = JSON.parse(jsonText);
            
            // Validate that it's an array
            if (!Array.isArray(parsedStates)) {
                setJsonError("JSON must be an array of states");
                return;
            }

            // Basic validation of state structure
            for (let i = 0; i < parsedStates.length; i++) {
                const state = parsedStates[i];
                if (!state.name || !state.goal || !Array.isArray(state.chat_options) || !Array.isArray(state.transitions)) {
                    setJsonError(`Invalid state structure at index ${i}. Each state must have name, goal, chat_options (array), and transitions (array).`);
                    return;
                }
            }

            // Apply changes and ensure UI updates
            const newStates = [...parsedStates];
            setStates(newStates);
            
            // Ensure selected index is valid
            const newSelectedIndex = selectedStateIndex >= newStates.length ? 0 : selectedStateIndex;
            setSelectedStateIndex(newSelectedIndex);
            
            setJsonError("");
            setHasChanges(true);
            setSaveMessage("✓ JSON applied successfully");
            setTimeout(() => setSaveMessage(""), 3000);
            
            // Switch back to visual editor to see changes
            setShowJson(false);
        } catch (error: any) {
            setJsonError(`Invalid JSON: ${error.message}`);
        }
    };

    const currentState = states[selectedStateIndex];

    // Show loading state while fetching script
    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-white/70 text-sm">Loading script...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center gap-2 mb-3 p-3 bg-white/5 rounded-lg border border-white/10">
                <button
                    onClick={addState}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add State
                </button>
                <button
                    onClick={saveScript}
                    disabled={saving}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? (
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                    )}
                    {saving ? "Saving..." : "Save"}
                </button>
                <button
                    onClick={() => setShowJson(!showJson)}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium rounded transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    {showJson ? "Visual Editor" : "JSON Editor"}
                </button>
                {saveMessage && (
                    <span className={`text-xs ${saveMessage.startsWith("✓") ? "text-green-400" : "text-red-400"}`}>
                        {saveMessage}
                    </span>
                )}
                {autoSaving && (
                    <span className="flex items-center gap-2 text-xs text-blue-400">
                        <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Auto-saving...
                    </span>
                )}
                {!autoSaving && hasChanges && (
                    <span className="text-xs text-yellow-400">
                        • Unsaved changes
                    </span>
                )}
                <div className="ml-auto text-xs text-white/50">
                    {states.length} state{states.length !== 1 ? "s" : ""}
                </div>
            </div>

            <div className="flex-1 flex gap-3 overflow-hidden">
                {/* State List Sidebar - Always visible for navigation */}
                <div className="w-48 flex-shrink-0 bg-white/5 rounded-lg border border-white/10 p-2 overflow-y-auto">
                    <h3 className="text-xs font-semibold text-white/70 mb-2 px-2">STATES ({states.length})</h3>
                    <div className="space-y-1">
                        {states.map((state, index) => (
                            <div
                                key={`${index}-${state.name}`}
                                className={`p-2 rounded cursor-pointer transition-colors ${selectedStateIndex === index
                                    ? "bg-blue-600 text-white"
                                    : "bg-white/5 hover:bg-white/10 text-white/70"
                                    }`}
                                onClick={() => {
                                    setSelectedStateIndex(index);
                                    if (showJson) {
                                        setShowJson(false);
                                    }
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-medium truncate">{state.name || `State ${index}`}</div>
                                        {index === 0 && (
                                            <div className="text-[10px] text-white/50 mt-0.5">Initial</div>
                                        )}
                                    </div>
                                    {states.length > 1 && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteState(index);
                                            }}
                                            className="ml-2 p-1 hover:bg-red-500/20 rounded"
                                        >
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* State Editor */}
                {!showJson ? (
                    <div className="flex-1 bg-white/5 rounded-lg border border-white/10 p-4 overflow-y-auto">
                        <div className="space-y-4">
                            {/* State Name */}
                            <div>
                                <label className="block text-xs font-semibold text-white/70 mb-2">
                                    STATE NAME
                                </label>
                                <input
                                    type="text"
                                    value={currentState.name}
                                    onChange={(e) =>
                                        updateState(selectedStateIndex, {
                                            ...currentState,
                                            name: e.target.value
                                        })
                                    }
                                    className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                                    placeholder="Enter state name"
                                />
                            </div>

                            {/* Goal */}
                            <div>
                                <label className="block text-xs font-semibold text-white/70 mb-2">
                                    GOAL
                                </label>
                                <textarea
                                    value={currentState.goal}
                                    onChange={(e) =>
                                        updateState(selectedStateIndex, {
                                            ...currentState,
                                            goal: e.target.value
                                        })
                                    }
                                    className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
                                    rows={2}
                                    placeholder="Describe the goal of this state"
                                />
                            </div>
                            <div className="flex flex-row items-center gap-8">
                                {/* Is Final State */}
                                <label className="flex-1 flex flex-row items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={currentState.is_final || false}
                                        onChange={(e) =>
                                            updateState(selectedStateIndex, {
                                                ...currentState,
                                                is_final: e.target.checked
                                            })
                                        }
                                        className="w-4 h-4 bg-black/20 border border-white/10 rounded cursor-pointer"
                                    />
                                    <span className="text-xs font-semibold text-white/70">
                                        Final State (conversation ends here)
                                    </span>
                                </label>

                                {/* Is Research State */}
                                <label className="flex-1 flex flex-row items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={currentState.is_research || false}
                                        onChange={(e) =>
                                            updateState(selectedStateIndex, {
                                                ...currentState,
                                                is_research: e.target.checked
                                            })
                                        }
                                        className="w-4 h-4 bg-black/20 border border-white/10 rounded cursor-pointer"
                                    />
                                    <span className="text-xs font-semibold text-white/70">
                                        Research State (use database search for response)
                                    </span>
                                </label>
                            </div>

                            {/* Chat Options */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-semibold text-white/70">
                                        CHAT OPTIONS
                                    </label>
                                    <button
                                        onClick={addChatOption}
                                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                                    >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add Option
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {currentState.chat_options.map((option, index) => (
                                        <div key={index} className="flex gap-2">
                                            <textarea
                                                value={option}
                                                onChange={(e) => updateChatOption(index, e.target.value)}
                                                className="flex-1 px-3 py-2 bg-black/20 border border-white/10 rounded text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
                                                rows={2}
                                                placeholder="Enter chat message option"
                                            />
                                            {currentState.chat_options.length > 1 && (
                                                <button
                                                    onClick={() => deleteChatOption(index)}
                                                    className="flex-shrink-0 px-2 text-red-400 hover:text-red-300"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Transitions */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-semibold text-white/70">
                                        TRANSITIONS
                                    </label>
                                    <button
                                        onClick={addTransition}
                                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                                    >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add Transition
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {currentState.transitions.map((transition, index) => (
                                        <div key={index} className="p-3 bg-black/20 rounded-lg border border-white/10 space-y-2">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-medium text-white/60">Transition {index + 1}</span>
                                                <button
                                                    onClick={() => deleteTransition(index)}
                                                    className="text-red-400 hover:text-red-300"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>

                                            {/* Automatic Transition Checkbox */}
                                            <div>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={transition.automatic || false}
                                                        onChange={() => toggleTransitionAutomatic(index)}
                                                        className="w-4 h-4 bg-black/20 border border-white/10 rounded cursor-pointer"
                                                    />
                                                    <span className="text-xs font-medium text-blue-400">
                                                        Automatic transition (no condition)
                                                    </span>
                                                </label>
                                            </div>

                                            {/* Condition - disabled if automatic */}
                                            <div>
                                                <label className={`block text-xs font-medium mb-1.5 ${transition.automatic ? 'text-white/30' : 'text-white/70'}`}>
                                                    Condition
                                                </label>
                                                <input
                                                    type="text"
                                                    value={transition.condition}
                                                    onChange={(e) => updateTransitionCondition(index, e.target.value)}
                                                    disabled={transition.automatic}
                                                    className={`w-full px-3 py-2 bg-black/20 border border-white/10 rounded text-white text-sm focus:outline-none focus:border-blue-500 ${transition.automatic ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    placeholder="e.g., user provided their name"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {/* State if condition met / Next state if automatic */}
                                                <div className="flex-1">
                                                    <label className="block text-xs font-medium text-green-400 mb-1.5">
                                                        {transition.automatic ? 'Next state' : 'State if condition met'}
                                                    </label>
                                                    <select
                                                        value={transition.if_true}
                                                        onChange={(e) => updateTransitionIfTrue(index, Number(e.target.value))}
                                                        className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded text-white text-sm focus:outline-none focus:border-green-500 cursor-pointer"
                                                    >
                                                        {states.map((state, idx) => (
                                                            <option key={idx} value={idx} className="bg-gray-800">
                                                                {state.name || `State ${idx}`}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* State if condition not met - disabled if automatic */}
                                                {!transition.automatic && (
                                                    <div className="flex-1">
                                                        <label className="block text-xs font-medium text-red-400 mb-1.5">
                                                            State if condition not met
                                                        </label>
                                                        <select
                                                            value={transition.if_false}
                                                            onChange={(e) => updateTransitionIfFalse(index, Number(e.target.value))}
                                                            className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded text-white text-sm focus:outline-none focus:border-red-500 cursor-pointer"
                                                        >
                                                            {states.map((state, idx) => (
                                                                <option key={idx} value={idx} className="bg-gray-800">
                                                                    {state.name || `State ${idx}`}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {currentState.transitions.length === 0 && (
                                        <p className="text-xs text-white/40 italic">No transitions defined</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* JSON Editor */
                    <div className="flex-1 bg-black/40 rounded-lg border border-white/10 p-4 flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h3 className="text-sm font-semibold text-white">JSON Editor</h3>
                                <p className="text-[10px] text-white/50 mt-0.5">Changes sync automatically with visual editor</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={applyJsonChanges}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                                >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Apply & View
                                </button>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(jsonText);
                                        setSaveMessage("✓ Copied to clipboard");
                                        setTimeout(() => setSaveMessage(""), 2000);
                                    }}
                                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Copy
                                </button>
                            </div>
                        </div>
                        
                        {jsonError && (
                            <div className="mb-3 p-3 bg-red-900/30 border border-red-500/50 rounded text-red-300 text-xs">
                                <div className="flex items-start gap-2">
                                    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div>
                                        <div className="font-semibold mb-1">JSON Error</div>
                                        <div>{jsonError}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mb-2 p-2 bg-blue-900/20 border border-blue-500/30 rounded text-xs text-blue-300">
                            <div className="flex items-start gap-2">
                                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <strong>Tip:</strong> Edit the JSON below, then click "Apply & View" to validate and switch to visual editor. Click any state in the sidebar to view it visually.
                                </div>
                            </div>
                        </div>

                        <textarea
                            value={jsonText}
                            onChange={(e) => setJsonText(e.target.value)}
                            className="flex-1 px-3 py-2 bg-black/40 border border-white/10 rounded text-green-400 text-xs font-mono focus:outline-none focus:border-blue-500 resize-none"
                            spellCheck={false}
                            placeholder="Enter valid JSON..."
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
