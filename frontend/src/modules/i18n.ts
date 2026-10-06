import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Language, LanguageCode } from '../types';

export const LANGUAGES: Language[] = [
  { code: 'en-US', name: 'English', nativeName: 'English', rtl: false, flag: '🇺🇸' },
  { code: 'ar-SA', name: 'Arabic', nativeName: 'العربية', rtl: true, flag: '🇸🇦' },
  { code: 'ur-PK', name: 'Urdu', nativeName: 'اردو', rtl: true, flag: '🇵🇰' },
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', rtl: false, flag: '🇮🇳' },
  { code: 'es-ES', name: 'Spanish', nativeName: 'Español', rtl: false, flag: '🇪🇸' },
  { code: 'fr-FR', name: 'French', nativeName: 'Français', rtl: false, flag: '🇫🇷' },
];

export type TKey =
  | 'appName' | 'scanning' | 'welcome' | 'parentSetup' | 'addChild'
  | 'childName' | 'childAge' | 'diagnosis' | 'save' | 'cancel'
  | 'next' | 'back' | 'schedule' | 'aacBoard' | 'rewards' | 'calmDown'
  | 'settings' | 'parentHub' | 'doctorPanel' | 'breatheIn' | 'breatheOut'
  | 'hold' | 'wellDone' | 'stars' | 'badges' | 'speak' | 'clear'
  | 'fontSize' | 'highContrast' | 'sound' | 'reduceMotion' | 'language'
  | 'enrollFace' | 'lookAtCamera' | 'capturingFace' | 'matchFound'
  | 'noMatch' | 'hello' | 'morning' | 'afternoon' | 'evening' | 'night'
  | 'content' | 'doctorApproved' | 'selectLanguage' | 'parentPin'
  | 'myDay' | 'breatheStart' | 'feelingCalm' | 'tapToSpeak' | 'sentence'
  | 'needsCategory' | 'feelingsCategory' | 'peopleCategory' | 'actionsCategory' | 'foodCategory'
  | 'scanningMessage' | 'enrollStep1' | 'enrollStep2' | 'enrollStep3' | 'childAdded'
  | 'noChildren' | 'deleteChild' | 'editChild' | 'allowedContent' | 'hello_child'
  // --- AAC board + voice-add (added for full localisation) ---
  | 'talk' | 'home' | 'buildSentence' | 'speakSentence' | 'removeLast' | 'clearSentence'
  | 'makeAWord' | 'emptyFolder' | 'sayTheWord' | 'sayTheWordHint' | 'tapToStart'
  | 'listeningTap' | 'checkTheWord' | 'checkTheWordHint' | 'typeTheWord' | 'hearIt'
  | 'nextFindPicture' | 'pickPicture' | 'pickPictureHint' | 'symbols' | 'photos' | 'aiMade'
  | 'camera' | 'gallery' | 'useSymbol' | 'tryAgain' | 'useThisPicture' | 'whichFolder'
  | 'newFolder' | 'createSave' | 'wordAdded' | 'wordAddedHint' | 'addAnother' | 'done'
  | 'skipTypeInstead' | 'step' | 'of' | 'reopenForLanguage'
  | 'games' | 'progress'
  // --- games screen ---
  | 'gScore' | 'gStreak' | 'gAccuracy' | 'gRound' | 'gCorrect' | 'gTryAgain'
  | 'gChooseGame' | 'gRounds' | 'gComplete' | 'gPlayAgain' | 'gBestStreak'
  | 'gAnimalMatch' | 'gAnimalMatchSub' | 'gLearnLetters' | 'gLearnLettersSub'
  | 'gLearnNumbers' | 'gLearnNumbersSub' | 'gColors' | 'gColorsSub'
  | 'gShapes' | 'gShapesSub' | 'gEmotions' | 'gEmotionsSub'
  | 'gFood' | 'gFoodSub' | 'gPuzzle' | 'gPuzzleSub' | 'gAccuracyLabel' | 'gCompletedChallenge'
  | 'gSequence' | 'gSequenceSub' | 'gTapNumberN'
  | 'gJigsaw' | 'gJigsawSub' | 'gJigsawHint'
  | 'gSort' | 'gSortSub' | 'gSortHint' | 'gSortAnimalsBin' | 'gSortFoodBin'
  // --- daily lesson (learning engine, Feature 1) ---
  | 'dpTodaysPracticeTitle' | 'dpTodaysPracticeCardsLeft' | 'dpTodaysPracticeDone'
  | 'dlHeaderTitle' | 'dlListenPrompt' | 'dlPicturePrompt' | 'dlMatchPrompt' | 'dlBuildPrompt'
  | 'dlSessionDoneTitle' | 'dlSessionDoneSub' | 'dlNoCardsToday' | 'dlCardOfTotal'
  // --- skill tree (learning engine, Feature 3) ---
  | 'skSkillRequesting' | 'skSkillGreetingSocial' | 'skSkillFeelingsBody' | 'skSkillFoodDrink'
  | 'skSkillPeopleFamily' | 'skSkillDailyRoutine' | 'skSkillPlacesGoing'
  | 'skLevel1Name' | 'skLevel2Name' | 'skLevel3Name' | 'skLevel4Name'
  | 'skPathTitle' | 'skPathSub' | 'skLockedHint' | 'skMasteryLabel' | 'skLevelLabel'
  | 'skNoWordsYet' | 'skUnlockedAnnounce' | 'skPracticeBtn'
  // --- learning settings modal (Feature 5) ---
  | 'lsModalTitle' | 'lsDifficultyLabel' | 'lsDifficultyEasy' | 'lsDifficultyMedium' | 'lsDifficultyHard'
  | 'lsLessonLengthLabel' | 'lsNewWordsLabel' | 'lsNewWordsOff' | 'lsCardTypesLabel'
  | 'lsTypeListenTap' | 'lsTypePictureWord' | 'lsTypeMatchPair' | 'lsTypeBuildIt'
  | 'lsTtsSpeedLabel' | 'lsTtsSlow' | 'lsTtsNormal' | 'lsReduceMotionNote'
  | 'lsSkillOverridesLabel' | 'lsOverrideAuto' | 'lsSaveBtn'
  // --- doctor panel: clinical milestone checklist (closing a known translation gap) ---
  | 'docMilestoneTitle' | 'docMilestoneInitiator' | 'docMilestoneInitiatorDesc'
  | 'docMilestoneLexical' | 'docMilestoneLexicalDesc' | 'docMilestoneMultiWord' | 'docMilestoneMultiWordDesc'
  | 'docMilestoneRoutine' | 'docMilestoneRoutineDesc'
  // --- weekly report export (Feature 6) ---
  | 'rptTitle' | 'rptDaysPracticed' | 'rptCurrentStreak' | 'rptDaysUnit' | 'rptNewWords'
  | 'rptWordsRetained' | 'rptEstPracticeTime' | 'rptMinUnit' | 'rptSkillMastery' | 'rptLevelWord'
  | 'rptNeedsMorePractice' | 'rptThisWeekCardTitle' | 'rptShareBtn' | 'rptNoStrugglingWords'
  | 'docSkillMasteryTitle' | 'docAttemptHistoryTitle' | 'docAttemptHistoryEmpty' | 'docExportHistoryBtn'
  | 'docTrendTitle' | 'docTrendEmpty' | 'docAttemptCorrect' | 'docAttemptRetry'
  // --- voice practice (Feature 4) ---
  | 'vpHeaderTitle' | 'vpPrivacyNote' | 'vpRecordHint' | 'vpRecordingLabel' | 'vpPlaybackLabel'
  | 'vpDonePracticingBtn' | 'vpNoWords' | 'vpMicDenied' | 'vpTapToHear'
  | 'vpRecordingsTitle' | 'vpRecordingsEmpty' | 'vpDeleteAllBtn' | 'vpDeleteAllConfirmTitle' | 'vpDeleteAllConfirmMsg'
  | 'vpDeleteOneConfirmTitle' | 'vpStorageUsedLabel' | 'vpDoctorReadOnlyNote'
  | 'setVoiceStorageLabel' | 'setVoiceStorageManageHint'
  // --- Tell Me mode (Picture -> Auto Sentence, Phases B/D) ---
  | 'tmHeaderTitle' | 'tmHint' | 'tmChooseIntentTitle' | 'tmNoWordsYet'
  // --- Sentence Frame Editor (Phase E/F) ---
  | 'sfeModalTitle' | 'sfeCurrentSentenceLabel' | 'sfeLockIntentLabel' | 'sfeAutomaticLabel'
  | 'sfeCustomTextLabel' | 'sfeCustomTextPlaceholder' | 'sfeClearOverrideBtn'
  | 'sfeUntaggedWordsTitle' | 'sfeUntaggedWordsHint' | 'sfeWordTypeLabel' | 'sfeIntentLabel' | 'sfeTagBtn' | 'sfeNoUntaggedWords'
  | 'sfWtPlace' | 'sfWtObject' | 'sfWtPerson' | 'sfWtFood' | 'sfWtVerb' | 'sfWtFeeling' | 'sfWtNeed' | 'sfWtRoutine'
  | 'sfIntentRequest' | 'sfIntentStatement' | 'sfIntentFeeling' | 'sfIntentPlan' | 'sfIntentRefusal'
  | 'gGreatJob' | 'gYouFinished'
  | 'exploreMoreGames' | 'playingBadge' | 'exercisesSuffix'
  | 'starsEarnedLabel' | 'bestStreakLabel'
  | 'gListen' | 'gChoicesLabel' | 'gEasyChoice' | 'gStandardChoice'
  // --- parent dashboard: progress screen ---
  | 'tabOverview' | 'tabTherapyGoals' | 'tabCareJournal' | 'tabPasscard'
  | 'tabVocabulary' | 'tabSchedule' | 'tabPrivacy' | 'adminBadge'
  | 'ageYearsEnrolledDays' | 'caregiverPasscardTitle' | 'caregiverPasscardSub'
  | 'sensoryCalmerTitle' | 'sensoryCalmerSub' | 'shareProgressTitle' | 'shareProgressSub'
  | 'summaryMetricsTitle' | 'totalWordTaps' | 'uniqueWordsUsed' | 'wordsThisWeek'
  | 'mostActiveDay' | 'consecutiveActiveDays' | 'fullSentencesSpoken'
  | 'correctionsUndoUsed' | 'longestSentence' | 'wordsUnit' | 'avgRoutineAdherence'
  | 'dayMon' | 'dayTue' | 'dayWed' | 'dayThu' | 'dayFri' | 'daySat' | 'daySun'
  | 'dayLetterM' | 'dayLetterT' | 'dayLetterW' | 'dayLetterF' | 'dayLetterS'
  | 'wordsTappedPerDaySubtitle' | 'wordsCountBadge' | 'wordsCommunicatedOnDay'
  | 'chartPeakLabel' | 'chartDailyActivityLabel' | 'chartTodayLabel'
  | 'progressIndicatorsTitle' | 'checkBoardUsedOnce' | 'checkBoardUsedOnceDetail'
  | 'checkVocabDiversity' | 'checkVocabDiversityDetail'
  | 'checkConsistentSchedule' | 'checkConsistentScheduleDetail'
  | 'checkMultiDayUse' | 'checkMultiDayUseDetail'
  | 'checkCumulativeVocab' | 'checkCumulativeVocabDetail'
  | 'tipNoWordsThisWeek' | 'tipProgressOnTrack' | 'wordSequenceLabel'
  // --- more screen ---
  | 'moreTitle' | 'adminControlCenterTitle' | 'adminControlCenterSub' | 'adminBadgeShort'
  | 'rowVoiceCommandMatch' | 'rowCategoryBuilder' | 'rowMyCategories' | 'rowPhraseLibrary'
  | 'rowContentReviewQueue' | 'rowSentencePicture' | 'rowMilestones' | 'rowCalmDown'
  | 'rowDoctorPanel' | 'rowAllChildren' | 'rowSettingsLanguage' | 'switchChildLabel'
  // --- doctor panel screen ---
  | 'patientsListBack' | 'doctorPanelSub' | 'patientHeaderLine' | 'exportReportBtn'
  | 'enrolledPatientsCount' | 'selectPatientHint' | 'noChildrenEnrolled'
  | 'ageYrsBadge' | 'weeklyWordsLabel' | 'therapyGoalsLabel'
  | 'tabAZPerformance' | 'tabTherapyGoalsShort' | 'tabClinicalNotes' | 'tabDoctorContact' | 'tabContent'
  | 'metricTotalWordTaps' | 'metricVocabDiversity' | 'metricSentencesSpoken' | 'metricRoutineAdherence'
  | 'speechSentenceFormationTitle' | 'longestVerbalCompositionSub' | 'wordsConstructedPrefix' | 'noFullSentenceLogged'
  | 'sevenDayVolumeTitle' | 'topCommunicatedVocabTitle' | 'tapsUnit' | 'noVocabTapsYet'
  | 'iMadeMistake' | 'undoOrClearMsg' | 'closeBtn' | 'undoLastWordBtn' | 'clearAllBtn' | 'oopsBtn'
  // --- parent hub screen ---
  | 'registeredChildProfilesCount' | 'addBtnShort' | 'childrenCareDirectoryTitle' | 'childrenCareDirectoryDesc'
  | 'enrollFirstChildHint' | 'removeChildTitle' | 'removeChildMsg' | 'removeBtnShort'
  | 'ageLabelShort' | 'enrolledSincePrefix' | 'metricWordsPerWeek' | 'metricStreak'
  | 'metricRoutineShort' | 'metricFaceScan' | 'faceScanActive' | 'faceScanOff'
  | 'launchBoardBtn' | 'passcardBtnLabel'
  // --- home screen ---
  | 'quickAccess' | 'todaySchedule' | 'communicateNow' | 'todaysSchedule'
  | 'playAGame' | 'parentDashboard' | 'levelDeveloping' | 'nextUp' | 'starsLabel'
  | 'dayStreak' | 'todayLabel' | 'moreStarsToLevel'
  | 'qCommunicate' | 'qPictureTalk' | 'qActivities' | 'happeningNow' | 'nextLabel' | 'nowBadge'
  | 'sBreakfast' | 'sPlayTime' | 'sAacSession' | 'sLunch' | 'sRestTime' | 'sSkillActivity'
  | 'stDone' | 'stNow' | 'stUpcoming' | 'tasksLabel' | 'doneSpoken'
  // --- progress / parent dashboard ---
  | 'pOverview' | 'pVocabulary' | 'pSchedule' | 'pPrivacy'
  | 'pWordsWeek' | 'pAdherence' | 'pGameStreak' | 'pMilestones' | 'pRecommendations'
  | 'pTotalWords' | 'pDiffWords' | 'pMostActive' | 'pWeekSummary'
  | 'pM1' | 'pM2' | 'pM3' | 'pM4' | 'pM5' | 'pDaysActive' | 'pActive'
  | 'pDailyUsage' | 'pMostUsed' | 'pWeeklyAdherence' | 'pExportIep' | 'pDataOnDevice'
  | 'pMathOnly' | 'pOnDeviceOnly' | 'pFaceRecognition' | 'pGeneralConsent'
  | 'pConsented' | 'pNotEnabled' | 'pNotGiven' | 'pDeleteFace' | 'pNoWordsYet'
  | 'pTip1' | 'pTip2' | 'pTip3' | 'pTip4' | 'pTip0' | 'pTimes'
  // --- settings ---
  | 'setSpeech' | 'setSpeakingSpeed' | 'setSlow' | 'setNormal' | 'setFast'
  | 'setBoard' | 'setHaptics' | 'setTilesPerRow' | 'setAccessibility' | 'setKiosk'
  | 'setLockOpen' | 'setKioskInfo' | 'setParentControls' | 'setChangePasscode'
  | 'setSetPasscode' | 'setState' | 'setNotSet' | 'setPixabay' | 'setBackup'
  | 'setExport' | 'setRestore'
  | 'pLegendExcellent' | 'pLegendGood' | 'pLegendNeeds'
  | 'pSummaryNone' | 'pSummaryUsing' | 'pSummaryOften' | 'pSummaryAnd'
  | 'pRoutinesStrong' | 'pRoutinesTrack' | 'pRoutinesMore' | 'pSummaryTail'
  // --- home screen: mood check-in + quick-express bar ---
  | 'moodQuestion' | 'quickExpressHeading' | 'feelingTag' | 'sayIAmFeeling'
  | 'bathroom' | 'needHelpPhrase' | 'needWaterPhrase' | 'needBathroomPhrase' | 'pleaseStopPhrase'
  | 'completedToday' | 'startExercise' | 'therapyTargetBadge' | 'tapToPracticeNow' | 'doctorsPlan'
  | 'unitWords' | 'viewFullSchedule' | 'defaultSpeechGoalTitle' | 'doctorsDailyGoal'
  // --- visual schedule screen ---
  | 'visualRoutineSubtitle' | 'readAloudBtn' | 'activitiesCompletedSuffix'
  | 'statusCompleted' | 'statusHappeningNow' | 'statusUpcoming'
  | 'addCustomRoutineTask' | 'addCustomRoutineActivity' | 'activityNameLabel' | 'activityNamePlaceholder'
  | 'scheduledTimeLabel' | 'scheduledTimePlaceholder' | 'activityIconLabel' | 'addToScheduleBtn'
  | 'firstThenBoardTitle' | 'firstThenSubtitle' | 'firstLabel' | 'thenLabel'
  | 'activityFallback' | 'rewardPlayFallback' | 'markFirstDoneBtn'
  | 'requiredAlertTitle' | 'requiredAlertMsg' | 'rightNowTimeFor' | 'allTasksFinished' | 'finishedGreatJob'
  // --- enroll child screen ---
  | 'namePlaceholder' | 'agePlaceholder' | 'selectAllThatApply' | 'faceCaptureFailed'
  | 'capturingEllipsis' | 'captureBtn' | 'finishBtn' | 'hasBeenAdded' | 'faceUnlockHint'
  | 'startWithChild' | 'doneCheck' | 'addAnotherChild'
  // --- face scan screen ---
  | 'positionFaceHint' | 'holdSteadyHint' | 'noChildEnrolled' | 'checkingFaceEllipsis' | 'adjustingLighting'
  | 'didntCatchFace' | 'cameraNotAvailable' | 'scanningFaceEllipsis' | 'lookedEverywhere' | 'cameraUnavailableMsg'
  | 'scanAgainBtn' | 'selectChildBtn' | 'continueWithoutCamera' | 'selectChildProfileBtn' | 'adminPortalBtn'
  | 'chooseChildProfileTitle' | 'tapChildProfileHint' | 'ageLabel' | 'welcomeBack'
  // --- category builder screen ---
  | 'cbHeaderTitle' | 'cbReviewTitle' | 'cbHeaderSubInput' | 'cbHeaderSubReview'
  | 'cbCommandLabel' | 'cbCommandPlaceholder' | 'cbListLabel' | 'cbListPlaceholder'
  | 'cbQuickStart' | 'cbGenerateBtn' | 'cbHint' | 'cbCategoryNameLabel'
  | 'cbGeneratingImages' | 'cbApproveSaveBtn' | 'cbEditWordTitle' | 'cbLabelField'
  | 'cbSpokenPhraseField' | 'cbNothingToAddTitle' | 'cbTryBuiltIn' | 'cbHeadsUpTitle'
  | 'cbAddWordFirst' | 'cbCategoryCreatedSpeech'
  // --- rewards screen ---
  | 'rFirstStar' | 'rFiveStars' | 'rTenStars' | 'rTwentyStars' | 'rFiftyStars'
  | 'rExplorer' | 'rReader' | 'rHelper' | 'rChildAchievements' | 'rPlusOneStar'
  | 'rBadgesEarnedSuffix' | 'rComingSoon' | 'rMoreStars' | 'rNeededSuffix'
  // --- calm down screen ---
  | 'cdAgain' | 'cdBegin' | 'cdStop' | 'cdTip'
  // --- add by voice screen ---
  | 'avThinkingCreatePic' | 'avCouldNotCreatePic' | 'avThinkingSavePic' | 'avCouldNotSavePic'
  | 'avThinkingListening' | 'avMicPermission' | 'avThinkingFindPics' | 'avCouldNotDownloadPic'
  | 'avCameraPermission' | 'avThinkingSavePhoto' | 'avGalleryPermission' | 'avTypeWordFirst'
  | 'avAiHint' | 'avFolderNamePlaceholder' | 'avDefaultCategoryName'
  // --- phrase match library screen ---
  | 'pmTitle' | 'pmTotal' | 'pmMatched' | 'pmCategories' | 'pmSearchPlaceholder'
  | 'pmAllCategories' | 'pmAllLevels' | 'pmLevelN' | 'pmNoMatch' | 'pmNoMatchHint'
  | 'pmCardSub' | 'pmGalleryPermission' | 'pmCameraPermission' | 'pmLabelRequired'
  | 'pmUncategorized' | 'pmRemovePhraseTitle' | 'pmRemovePhraseMsg' | 'pmRemove'
  | 'pmEditPhrase' | 'pmAddNewPhrase' | 'pmTakePhoto' | 'pmGallery' | 'pmLabelField'
  | 'pmLabelPlaceholder' | 'pmTriggerPhrasesLabel' | 'pmTriggerPhrasesPlaceholder'
  | 'pmCategoryLabel' | 'pmCategoryPlaceholder' | 'pmLevelLabel' | 'pmSourceBookLabel'
  | 'pmSourceBookPlaceholder' | 'pmLicenseLabel' | 'pmLicensePlaceholder' | 'pmImagePreview'
  // --- content review queue screen ---
  | 'crqTitle' | 'crqPending' | 'crqApproved' | 'crqRejected' | 'crqAll' | 'crqInfoText'
  | 'crqNothingToShow' | 'crqEmptyPending' | 'crqEmptyOther' | 'crqSourceLicense'
  | 'crqCategoryLevel' | 'crqApprove' | 'crqEdit' | 'crqReject' | 'crqClear'
  | 'crqAlreadyReviewedTitle' | 'crqAlreadyReviewedMsg' | 'crqApprovePublishTitle'
  | 'crqApprovePublishMsg' | 'crqRejectTitle' | 'crqRejectMsg' | 'crqDeleteRecordTitle'
  | 'crqDeleteRecordMsg' | 'crqDelete' | 'crqGalleryPermission' | 'crqCameraPermission'
  | 'crqEditTitle' | 'crqImagePickHint' | 'crqCameraBtn' | 'crqGalleryBtn' | 'crqDetectedPhrase'
  | 'crqDetectedPhrasePlaceholder' | 'crqAltVariations' | 'crqAltVariationsPlaceholder'
  | 'crqSuggestedLabel' | 'crqSuggestedLabelPlaceholder' | 'crqCategoryLabel' | 'crqCategoryPlaceholder'
  | 'crqLevelLabel' | 'crqSourceLabel' | 'crqSourcePlaceholder' | 'crqLicenseLabel'
  | 'crqLicensePlaceholder' | 'crqReviewerNote' | 'crqReviewerNotePlaceholder'
  // --- voice command match screen ---
  | 'vcmTitle' | 'vcmBreadcrumb' | 'vcmTapMic' | 'vcmTrySaying' | 'vcmListening'
  | 'vcmListeningPlaceholder' | 'vcmCancel' | 'vcmMatchingVoice' | 'vcmHeardPrefix'
  | 'vcmCategoryLabel' | 'vcmLevelLabel' | 'vcmPlayAgain' | 'vcmNoMatchTitle' | 'vcmNoMatchSub'
  | 'vcmErrorTitle' | 'vcmErrorDefault' | 'vcmPracticeTitle' | 'vcmStartSpeaking' | 'vcmMatching'
  | 'vcmTryAnother' | 'vcmDoneSpeaking' | 'vcmClearResult' | 'vcmVoiceUnavailable' | 'vcmMicStartFail'
  | 'vcmSampleOnTable' | 'vcmSampleUnderTable' | 'vcmSampleInSomething' | 'vcmSampleAboveTable' | 'vcmSampleNearTable'
  // --- my categories screen (final pass) ---
  | 'mcWordsCount' | 'mcAddWord' | 'mcSortAZ' | 'mcGroups' | 'mcRecordedVoice' | 'mcTextToSpeech'
  | 'mcMoveHint' | 'mcFolderTitle' | 'mcFolderNamePlaceholder' | 'mcDeleteFolderTitle' | 'mcDeleteFolderMsg'
  | 'mcDelete' | 'mcNothingToExport' | 'mcBackupShareTitle' | 'mcInvalidBackupJson' | 'mcRestoreCompleteTitle'
  | 'mcRestoredWithWarningsTitle' | 'mcRestoreSummary' | 'mcMyCategoriesTitle' | 'mcCaregiverMade'
  | 'mcAddWordByVoice' | 'mcDefaultFolderName' | 'mcNewFolder' | 'mcBulkBuild' | 'mcExportBackup' | 'mcImport'
  | 'mcEmptyFolders' | 'mcHiddenFromChild' | 'mcPasteBackupTitle' | 'mcRestore'
  | 'mcAddSubCategory' | 'mcSubCategories' | 'mcAddSubCategoryTitle' | 'mcSubCategoryPlaceholder'
  | 'mcFindWord' | 'mcColWord' | 'mcColUseCount' | 'mcColLastUsed' | 'mcTimesCount' | 'mcNotYet' | 'mcNoWordsMatch'
  // --- admin panel screen ---
  | 'admLoading' | 'admTabBoards' | 'admTabChildren' | 'admTabContent' | 'admTabSettings' | 'admTabAnalytics'
  | 'admHeaderTitle' | 'admSuperAdmin' | 'admHeaderSubtitle'
  | 'admCategoriesTitle' | 'admCategoriesSubtitle' | 'admAddCategory' | 'admTotalTiles' | 'admAddCardBtn'
  | 'admSearchCardsPlaceholder' | 'admNoCardsFound' | 'admAddFirstCard'
  | 'admSyncTitle' | 'admSyncDesc' | 'admSyncNow'
  | 'admRequired' | 'admEnterCategoryName' | 'admSuccess' | 'admCategoryCreated'
  | 'admDeleteCategoryTitle' | 'admDeleteCategoryMsg' | 'admDelete'
  | 'admDeleteCardTitle' | 'admDeleteCardMsg'
  | 'admChildrenTitle' | 'admChildrenSubtitle' | 'admEnrollChild' | 'admAgeEnrolled' | 'admNoDiagnoses'
  | 'admSetActive' | 'admEditRecord' | 'admNoChildren' | 'admEnrollFirstChild'
  | 'admInvalidInput' | 'admInvalidNameAge' | 'admSaved' | 'admProfileUpdated'
  | 'admDeleteChildTitle' | 'admDeleteChildMsg' | 'admDeleteProfile'
  | 'admContentTitle' | 'admContentSubtitle' | 'admReviewQueue'
  | 'admArasaacTitle' | 'admArasaacDesc' | 'admIntegratedCached'
  | 'admOpenSymbolsTitle' | 'admOpenSymbolsDesc' | 'admReadyOnDemand'
  | 'admCacheTitle' | 'admCacheDesc' | 'admClearCache' | 'admCacheCleaned' | 'admCacheCleanedMsg'
  | 'admSettingsTitle' | 'admSettingsSubtitle' | 'admApiKeysTitle' | 'admOpenAiKeyLabel'
  | 'admAiConfigured' | 'admAiOptional' | 'admPixabayKeyLabel' | 'admPixabayPlaceholder'
  | 'admSpeechEngineTitle' | 'admVoiceTest' | 'admSpeechRateLabel' | 'admPlaying' | 'admTestVoice'
  | 'admSpeechPreset' | 'admPresetSlow' | 'admPresetNormal' | 'admPresetFast'
  | 'admSoundFx' | 'admHaptics' | 'admLanguageTitle'
  | 'admSecurityTitle' | 'admSetPin' | 'admPinPlaceholder' | 'admUpdatePin'
  | 'admKioskLock' | 'admKioskDesc'
  | 'admBackupTitle' | 'admBackupDesc' | 'admExportJson' | 'admImportJson'
  | 'admOpenAiKeySaved' | 'admPixabayKeySaved' | 'admInvalidPin' | 'admPinDigitsMsg'
  | 'admPinSavedTitle' | 'admPinSavedMsg'
  | 'admPasteBackupJson' | 'admRestoredMsg' | 'admError' | 'admBackupInvalidStruct'
  | 'admInvalidJsonTitle' | 'admInvalidJsonMsg'
  | 'admSyncBoardLangTitle' | 'admSyncBoardLangMsg' | 'admTranslate' | 'admCompleted' | 'admSeedTranslated'
  | 'admAnalyticsTitle' | 'admAnalyticsSubtitle' | 'admReport' | 'admExportCsv' | 'admReportTemplate'
  | 'admEnrolledPatients' | 'admWeeklyWordTaps' | 'admSentencesSpoken' | 'admAvgAdherence'
  | 'admTopVocab' | 'admTapsSuffix' | 'admNoWordEvents'
  | 'admNewCategoryTitle' | 'admNewCategorySubtitle' | 'admCategoryNameLabel' | 'admCategoryNamePlaceholder'
  | 'admCategoryIconLabel' | 'admCreateCategory'
  | 'admEditChildTitle' | 'admEditChildSubtitle' | 'admChildNameLabel' | 'admAgeYearsLabel'
  | 'admDensityLabel' | 'admDensityBeginner' | 'admDensityDense'
  | 'admPageStyleLabel' | 'admCategoryFolders' | 'admCategoryFoldersSub' | 'admFixedCoreGrid' | 'admFixedCoreGridSub'
  | 'admDiagnosesTagsLabel' | 'admSaveChanges'
  | 'admBackupModalTitle' | 'admBackupModalSubtitle' | 'admPasteJsonPlaceholder' | 'admCloseBtn' | 'admRestoreData'
  // --- doctor panel screen: therapy/notes/contact/permissions tabs + modals ---
  | 'docRequiredGoalMsg' | 'docGoalSuccessMsg' | 'docDeleteGoalTitle' | 'docDeleteGoalMsg' | 'docDelete' | 'docCancel'
  | 'docRequiredNoteMsg' | 'docNoteSavedMsg' | 'docDeleteNoteTitle' | 'docDeleteNoteMsg'
  | 'docContactUpdatedTitle' | 'docContactUpdatedMsg' | 'docPhoneCallTitle' | 'docCallMsg' | 'docEmailTitle' | 'docEmailMsg'
  | 'docTherapyCatSpeech' | 'docTherapyCatSensory' | 'docTherapyCatOccupational' | 'docTherapyCatBehavioral'
  | 'docPrescribedGoalsTitle' | 'docPrescribedGoalsSub' | 'docPrescribeGoal' | 'docCompletedBadge' | 'docInProgress'
  | 'docPrescribedByLine' | 'docProgressLabel' | 'docIncrementPrefix'
  | 'docNoGoalsYet' | 'docPrescribeFirstGoal'
  | 'docConsultationNotesTitle' | 'docConsultationNotesSub' | 'docAddNote' | 'docByAuthorDate' | 'docKeyRecommendations'
  | 'docNoNotesYet' | 'docAddClinicalObservation'
  | 'docContactTitle' | 'docContactSub' | 'docEditContact' | 'docCallDoctor' | 'docEmailClinic' | 'docShareIep'
  | 'docClinicalInstructions' | 'docPermissionsInfo' | 'docEnableAll' | 'docDisableAll'
  | 'docPrescribeGoalModalTitle' | 'docPrescribeGoalModalSub' | 'docGoalTitleLabel' | 'docGoalTitlePlaceholder'
  | 'docTherapyCategoryLabel' | 'docTargetCountLabel' | 'docUnitLabel'
  | 'docPrescribingClinicianLabel' | 'docPrescribingClinicianPlaceholder' | 'docAssignGoal'
  | 'docAddNoteModalTitle' | 'docAddNoteModalSub' | 'docNoteTitleLabel' | 'docNoteTitlePlaceholder'
  | 'docAttendingDoctorLabel' | 'docDoctorNamePlaceholder'
  | 'docClinicalObservationLabel' | 'docClinicalObservationPlaceholder'
  | 'docCaregiverRecsLabel' | 'docCaregiverRecsPlaceholder' | 'docSaveConsultation'
  | 'docEditDoctorProfileTitle' | 'docEditDoctorProfileSub' | 'docDoctorNameLabel' | 'docClinicalSpecialityLabel'
  | 'docClinicNameLabel' | 'docPhoneLabel' | 'docEmailLabel' | 'docConsultingHoursLabel' | 'docSaveContact'
  | 'docDefaultDoctorName' | 'docDefaultSpeciality' | 'docDefaultClinicName' | 'docDefaultContactNotes' | 'docDefaultDisplayNotes'
  | 'docReportTemplate' | 'docNoVocabDataRecorded' | 'docNoGoalsAssignedYet' | 'docNoNotesLoggedYet'
  | 'docOccurrencesSuffix' | 'docRecommendationsPrefix' | 'docDefaultRecommendation' | 'docDoctorFallback'
  // --- parent setup screen ---
  | 'psFamilySection' | 'psManageProfiles' | 'psEnrolledBadge' | 'psEnrollSubtitle'
  | 'psClinicalSection' | 'psDoctorPanelSub' | 'psClinicalBadge'
  | 'psAdminTitle' | 'psAdminSub' | 'psPinProtectedBadge'
  | 'psContentSection' | 'psCategoryBuilderTitle' | 'psCategoryBuilderSub'
  | 'psSentencePictureTitle' | 'psSentencePictureSub'
  | 'psSystemSection' | 'psAccessibilitySub'
  | 'psParentAreaBadge' | 'psHeaderSub' | 'psWelcomeCaregiver' | 'psChildrenConfigured'
  | 'psChildrenLabel' | 'psActiveStatus' | 'psOfflineAac' | 'psIepReady' | 'psReturnToScanner'
  // --- sentence picture screen ---
  | 'spExample1' | 'spExample2' | 'spExample3' | 'spExample4' | 'spExample5'
  | 'spNoPollinationsToken' | 'spEngineSlow' | 'spNoAiEngine' | 'spCouldNotMake' | 'spEngineTooLong' | 'spEngineNoResponse'
  | 'spSpeakKeyboardTitle' | 'spSpeakKeyboardMsg' | 'spDidntCatchTitle' | 'spTryAgainType'
  | 'spBadgeLibrary' | 'spBadgeLibraryNew' | 'spBadgeLibraryAi' | 'spBadgeInstant'
  | 'spHeaderTitle' | 'spHeaderSubWithLib' | 'spHeaderSubSavedSuffix' | 'spHeaderSubDefault'
  | 'spUnderstanding' | 'spMakingPicture'
  | 'spKeepTalkingOn' | 'spStartOver' | 'spRedraw' | 'spRealPicture'
  | 'spMicHintAgent' | 'spMicHintNoAgent' | 'spInstantScene' | 'spMakeFullPicture'
  | 'spUnderstoodWell' | 'spPartlyUnderstood' | 'spUnderstoodSuffix'
  | 'spTypeSentencePlaceholder' | 'spListeningTapStop' | 'spTurningSpeechToText' | 'spSpeakSentence'
  | 'spKeyboardMicHint2' | 'spReadAloud' | 'spClear' | 'spTrySentence' | 'spScienceConcepts' | 'spBigHint'
  | 'spModalTitle' | 'spModalBody' | 'spKeyPlaceholder'
  | 'spFlowerLabel' | 'spSeedsLabel' | 'spFlowerAbsent' | 'spSeedsAbsent' | 'spBackboneHighlighted' | 'spNoBackbone'
  // --- accessibility screen ---
  | 'accKioskOption2Title' | 'accBestEffortLock' | 'accBackDisabled' | 'accScreenAwake' | 'accExitTempBullet'
  | 'accAndroidHardenedTitle' | 'accInstallApkBullet' | 'accToggleKioskBullet' | 'accFactoryResetBullet'
  | 'accIosGuidedTitle' | 'accIosSettingsBullet' | 'accIosPasscodeBullet' | 'accIosLaunchBullet' | 'accIosExitBullet'
  | 'accPasscodeModalTitle' | 'accPasscodeModalBody' | 'accPasscodePlaceholder'
  | 'accPixabayModalTitle' | 'accPixabayModalBody' | 'accPixabayPlaceholder'
  | 'accRestoreModalTitle' | 'accRestoreModalBody' | 'accRestorePlaceholder' | 'accRestoreBtn'
  | 'accPasscodeInvalid' | 'accNothingToBackup' | 'accInvalidBackupText'
  | 'accRestoreCompleteTitle' | 'accRestoreWarningsTitle' | 'accRestoreSummary'
  | 'vcmBookLabel'
  // --- App.tsx kiosk-exit shell + PinGate + misc shared components ---
  | 'appKioskExitTitle' | 'appKioskExitBody' | 'appExitPasscodePrompt' | 'appIncorrectPasscode'
  | 'appEnterBtn' | 'appKioskExitA11y' | 'pgBoardEditorTitle'
  | 'pgDefaultTitle' | 'pgEnterPasscodeSub' | 'pgWrongPasscode'
  | 'pgCreatePasscodeSub' | 'pgConfirmPasscodeSub' | 'pgPasscodeMismatch' | 'pgPasscodeCreated'
  | 'qabMistake' | 'qabAttention'
  | 'scEmptyHint'
  | 'ssBodyTitle' | 'ssAnatomyHint' | 'ssEmptyHint'
  // --- SensoryCalmerModal ---
  | 'scmTitle' | 'scmSubTitle' | 'scmTabBreathing' | 'scmTabGrounding' | 'scmTabAmbient'
  | 'scmBreathingHeader' | 'scmBreathingDesc' | 'scmPhaseInhale' | 'scmPhaseHold' | 'scmPhaseExhale' | 'scmPhaseRest'
  | 'scmTipInhale' | 'scmTipHold' | 'scmTipExhale' | 'scmTipRest' | 'scmSeconds4'
  | 'scmPauseBubble' | 'scmResumeRhythm'
  | 'scmGroundingHeader' | 'scmGroundingDesc'
  | 'scmStepSee' | 'scmStepTouch' | 'scmStepHear' | 'scmStepSmell' | 'scmStepTaste'
  | 'scmExSee' | 'scmExTouch' | 'scmExHear' | 'scmExSmell' | 'scmExTaste'
  | 'scmResetChecklist'
  | 'scmAmbientHeader' | 'scmAmbientDesc'
  | 'scmSoundRainTitle' | 'scmSoundRainDesc' | 'scmSoundOceanTitle' | 'scmSoundOceanDesc'
  | 'scmSoundWhiteTitle' | 'scmSoundWhiteDesc' | 'scmSoundWindTitle' | 'scmSoundWindDesc'
  | 'scmPlaying' | 'scmTapToPlay' | 'scmStopAll'
  // --- EmergencyPasscardModal ---
  | 'epcDefaultContactName' | 'epcDefaultContactNameWithDoctor' | 'epcDefaultCommStyle'
  | 'epcDefaultTrigger1' | 'epcDefaultTrigger2' | 'epcDefaultTrigger3' | 'epcDefaultTrigger4'
  | 'epcDefaultCalm1' | 'epcDefaultCalm2' | 'epcDefaultCalm3' | 'epcDefaultCalm4'
  | 'epcDefaultAllergy' | 'epcDefaultDietary' | 'epcDefaultSpecial'
  | 'epcSavedTitle' | 'epcSavedBody' | 'epcCommFallback'
  | 'epcShareHeader' | 'epcShareChildLine' | 'epcShareDiagnoses' | 'epcShareContactHeader'
  | 'epcShareNotSet' | 'epcShareDoctorLine' | 'epcShareCommHeader' | 'epcShareTriggersHeader'
  | 'epcShareCalmHeader' | 'epcShareAllergiesHeader' | 'epcShareSpecialHeader' | 'epcShareNone'
  | 'epcNoPhoneTitle' | 'epcNoPhoneBody'
  | 'epcTitle' | 'epcSubTitle' | 'epcAgeProfile' | 'epcEditSectionTitle'
  | 'epcLabelContactName' | 'epcLabelContactPhone' | 'epcLabelCommStyle' | 'epcLabelTriggers'
  | 'epcLabelCalming' | 'epcLabelAllergies' | 'epcLabelSpecial'
  | 'epcPlaceholderContactName' | 'epcPlaceholderContactPhone' | 'epcPlaceholderCommStyle'
  | 'epcPlaceholderTriggers' | 'epcPlaceholderCalming' | 'epcPlaceholderAllergies' | 'epcPlaceholderSpecial'
  | 'epcSavePasscard' | 'epcPrimaryContact' | 'epcNoPhoneYet' | 'epcCall' | 'epcPediatrician'
  | 'epcDrClinicLine' | 'epcHowICommunicate' | 'epcSensoryTriggers' | 'epcWhatCalms'
  | 'epcAllergiesNotes' | 'epcAllergiesLabel' | 'epcCaregiverNotesLabel' | 'epcEditBtn' | 'epcShareBtn'
  // --- WordEditor ---
  | 'weCameraPermission' | 'weSavingPhoto' | 'weGalleryPermission' | 'weSavingPicture'
  | 'weDownloading' | 'weDownloadFailed' | 'weMicPermission' | 'weTypeWordFirst'
  | 'weDeleteWordTitle' | 'weDelete' | 'weEditWord' | 'weAddWord' | 'weFindPicture'
  | 'weWordPhrase' | 'wePicture' | 'weVoice' | 'weTileSize' | 'weTileColor'
  | 'wePlaceholderWord' | 'wePlaceholderEmoji' | 'wePlaceholderSearch'
  | 'weCamera' | 'weGallery' | 'weSearch' | 'weRemove'
  | 'wePreview' | 'weReRecord' | 'weStop' | 'weRecordVoice' | 'weStopRecording'
  | 'weVoiceNoteRecorded' | 'weVoiceNoteTts' | 'weUseTtsInstead'
  | 'weSaveChanges' | 'weAddToBoard' | 'weSourceOpenSymbols' | 'weSourcePhotosKey'
  // --- Angel Talk Hub (MoreMenu) ---
  | 'hubTitle' | 'activeChildLabel' | 'mainAppsSection' | 'homeHub'
  | 'aacTalkBoard' | 'dailyRoutineSchedule' | 'speechLearningGames' | 'doctorProgressReports'
  | 'parentClinicalToolsSection'
  | 'visualSocialStoriesTitle' | 'visualSocialStoriesDesc'
  | 'addChildProfileTitle' | 'addChildProfileDesc'
  | 'myCategoriesWordsTitle' | 'myCategoriesWordsDesc'
  | 'categoryBuilderGenTitle' | 'categoryBuilderGenDesc'
  | 'voiceCommandMatchTitle' | 'voiceCommandMatchDesc'
  | 'phraseLibraryTitle' | 'phraseLibraryDesc'
  | 'contentReviewQueueTitle' | 'contentReviewQueueDesc'
  | 'parentPortalAddTitle' | 'parentPortalAddDesc'
  | 'settingsAccessibilityTitle' | 'settingsAccessibilityDesc'
  | 'switchChildFaceTitle' | 'switchChildFaceDesc'
  // --- Caregiver Space / My Categories ---
  | 'caregiverSpaceBadge' | 'shapeVocabTitle' | 'shapeVocabDesc'
  | 'voiceAddBtn' | 'bulkAddBtn' | 'addWordBtn'
  | 'shelvesHeader' | 'shelvesSub' | 'newShelfBtn'
  | 'editSubCatPill' | 'editShelfPill' | 'findAWordPlaceholder'
  | 'colWord' | 'colUseCount' | 'colLastUsed' | 'colActions'
  | 'timesUsed' | 'lastUsedToday' | 'lastUsedNotYet'
  | 'hiddenFromChildNote' | 'noWordsInShelfTitle' | 'noWordsInShelfSub'
  | 'addSubCategorySidebar' | 'wordsInSubCatMeta' | 'wordsInShelfAllMeta'
  | 'wordsOnDeviceMeta' | 'hiddenShelfNote'
  | 'deleteConfirmTitle' | 'deleteConfirmMsg' | 'confirmDeleteBtn'
  | 'cancelBtn' | 'saveChangesBtn';

type TMap = Record<TKey, string>;
type AllTranslations = { 'en-US': TMap } & Partial<Record<LanguageCode, Partial<TMap>>>;

const T: AllTranslations = {
  'en-US': {
    appName: 'Angel Talk',
    scanning: 'Looking for you…',
    welcome: 'Welcome!',
    parentSetup: 'Parent Setup',
    addChild: 'Add a Child',
    childName: "Child's Name",
    childAge: "Age (years)",
    diagnosis: 'Needs',
    save: 'Save',
    cancel: 'Cancel',
    next: 'Next',
    back: 'Back',
    schedule: 'My Day',
    aacBoard: 'Talk Board',
    rewards: 'My Stars',
    calmDown: 'Calm Down',
    settings: 'Settings',
    parentHub: 'All Children',
    doctorPanel: 'Doctor Panel',
    breatheIn: 'Breathe In',
    breatheOut: 'Breathe Out',
    hold: 'Hold',
    wellDone: 'Well Done! ⭐',
    stars: 'Stars',
    badges: 'Badges',
    speak: 'Speak',
    clear: 'Clear',
    fontSize: 'Font Size',
    highContrast: 'High Contrast',
    sound: 'Sound',
    reduceMotion: 'Reduce Motion',
    language: 'Language',
    enrollFace: 'Register Face',
    lookAtCamera: 'Look at the camera 😊',
    capturingFace: 'Got it! 📸',
    matchFound: "I found you!",
    noMatch: "New friend! Let's set up.",
    hello: 'Hello',
    morning: 'Good Morning',
    afternoon: 'Good Afternoon',
    evening: 'Good Evening',
    night: 'Good Night',
    content: 'My Learning',
    doctorApproved: 'Doctor Approved',
    selectLanguage: 'Choose Your Language',
    parentPin: 'Parent / Doctor Area',
    myDay: 'My Day',
    breatheStart: 'Tap the circle to begin',
    feelingCalm: 'Feeling calm 🌿',
    tapToSpeak: 'Tap a picture to speak',
    sentence: 'My sentence:',
    needsCategory: 'Needs',
    feelingsCategory: 'Feelings',
    peopleCategory: 'People',
    actionsCategory: 'Actions',
    foodCategory: 'Food',
    scanningMessage: 'Please look at the camera',
    enrollStep1: 'Step 1: Look straight ahead',
    enrollStep2: 'Step 2: Turn a little left',
    enrollStep3: 'Step 3: Turn a little right',
    childAdded: 'Child added! 🎉',
    noChildren: 'No children yet. Add one!',
    deleteChild: 'Remove',
    editChild: 'Edit',
    allowedContent: 'Allowed Content',
    hello_child: 'Hello',
    // App.tsx / PinGate / shared components
    appKioskExitTitle: 'Admin Kiosk Exit',
    appKioskExitBody: 'Enter the 4-digit admin passcode to leave kiosk mode for 5 minutes.',
    appExitPasscodePrompt: 'Enter the 4-digit passcode.',
    appIncorrectPasscode: 'Incorrect passcode.',
    appEnterBtn: 'Enter',
    appKioskExitA11y: 'Kiosk exit (5 taps)',
    pgBoardEditorTitle: 'Board editor',
    pgDefaultTitle: 'Parent area',
    pgEnterPasscodeSub: 'Enter the 4-digit passcode',
    pgWrongPasscode: 'Wrong passcode — try again',
    pgCreatePasscodeSub: 'Create a 4-digit parent passcode to protect this area',
    pgConfirmPasscodeSub: 'Enter the same 4 digits again to confirm',
    pgPasscodeMismatch: "Those didn't match — let's try again",
    pgPasscodeCreated: 'Passcode set!',
    qabMistake: 'Mistake',
    qabAttention: 'Attention',
    scEmptyHint: 'Say or type a sentence — the picture builds as you talk.',
    ssBodyTitle: 'Parts of the body',
    ssAnatomyHint: 'Say "heart", "add lungs", "add stomach"… to build the diagram.',
    ssEmptyHint: 'Say an object — "table", then "cat above the table", then "open the cat\'s eyes".',
    // SensoryCalmerModal
    scmTitle: 'Sensory Calming Toolkit',
    scmSubTitle: 'Gentle regulation for anxiety and sensory overload',
    scmTabBreathing: 'Breathing Bubble',
    scmTabGrounding: '5-4-3-2-1 Grounding',
    scmTabAmbient: 'Soothing Sounds',
    scmBreathingHeader: '4-4-4-4 Box Breathing Guide',
    scmBreathingDesc: 'Watch the bubble expand and contract to gently calm the nervous system.',
    scmPhaseInhale: 'Inhale',
    scmPhaseHold: 'Hold',
    scmPhaseExhale: 'Exhale',
    scmPhaseRest: 'Rest',
    scmTipInhale: 'Breathe in slowly through the nose...',
    scmTipHold: 'Gently hold your breath...',
    scmTipExhale: 'Release softly through the mouth...',
    scmTipRest: 'Stay still and calm...',
    scmSeconds4: '4s',
    scmPauseBubble: 'Pause Bubble',
    scmResumeRhythm: 'Resume Rhythm',
    scmGroundingHeader: '5-4-3-2-1 Sensory Grounding',
    scmGroundingDesc: 'A proven clinical technique to help a child detach from distress and reconnect with their physical senses.',
    scmStepSee: 'Things you can SEE',
    scmStepTouch: 'Things you can TOUCH',
    scmStepHear: 'Sounds you can HEAR',
    scmStepSmell: 'Things you can SMELL',
    scmStepTaste: 'Thing you can TASTE',
    scmExSee: 'Look around for 5 colors or objects in the room',
    scmExTouch: 'Touch your clothes, table, pillow, or hands',
    scmExHear: 'Listen for the fan, birds, breathing, or voices',
    scmExSmell: 'Smell fresh air, soap, or your shirt',
    scmExTaste: 'Take a sip of cool water or focus on your mouth',
    scmResetChecklist: 'Reset Grounding Checklist',
    scmAmbientHeader: 'Soothing Sensory Soundscapes',
    scmAmbientDesc: 'Soft, continuous auditory masking to reduce the impact of sudden environmental noises.',
    scmSoundRainTitle: 'Soft Rain',
    scmSoundRainDesc: 'Gentle rain on leaves',
    scmSoundOceanTitle: 'Ocean Waves',
    scmSoundOceanDesc: 'Slow rhythmic shoreline',
    scmSoundWhiteTitle: 'White Noise',
    scmSoundWhiteDesc: 'Steady background hush',
    scmSoundWindTitle: 'Forest Breeze',
    scmSoundWindDesc: 'Rustling trees and pine',
    scmPlaying: 'Playing',
    scmTapToPlay: 'Tap to Play',
    scmStopAll: 'Stop All Sounds',
    // EmergencyPasscardModal
    epcDefaultContactName: 'Parent / Guardian',
    epcDefaultContactNameWithDoctor: 'Family Emergency Contact',
    epcDefaultCommStyle: 'Uses Angel Talk AAC tablet, gestures, and picture cards.',
    epcDefaultTrigger1: 'Loud sudden sounds',
    epcDefaultTrigger2: 'Bright fluorescent lights',
    epcDefaultTrigger3: 'Crowded rooms',
    epcDefaultTrigger4: 'Unexpected touch',
    epcDefaultCalm1: 'Noise-cancelling headphones',
    epcDefaultCalm2: 'Deep pressure squeeze / weighted blanket',
    epcDefaultCalm3: 'Quiet dimmed corner',
    epcDefaultCalm4: 'Give AAC board to communicate needs',
    epcDefaultAllergy: 'No known food allergies',
    epcDefaultDietary: 'None',
    epcDefaultSpecial: 'Please do not force eye contact. Speak in short, calm sentences.',
    epcSavedTitle: 'Saved',
    epcSavedBody: 'Caregiver Passcard has been updated successfully.',
    epcCommFallback: 'Uses Angel Talk AAC board',
    epcShareHeader: '🚨 EMERGENCY CAREGIVER PASSCARD 🚨',
    epcShareChildLine: 'Child: {name} (Age {age})',
    epcShareDiagnoses: 'Diagnoses: {list}',
    epcShareContactHeader: '📞 PRIMARY EMERGENCY CONTACT:',
    epcShareNotSet: 'Not set',
    epcShareDoctorLine: 'Doctor: Dr. {name} ({phone})',
    epcShareCommHeader: '🗣️ HOW I COMMUNICATE:',
    epcShareTriggersHeader: '⚠️ SENSORY TRIGGERS (Things that distress me):',
    epcShareCalmHeader: '💚 WHAT HELPS ME CALM DOWN:',
    epcShareAllergiesHeader: '🥜 ALLERGIES:',
    epcShareSpecialHeader: 'ℹ️ SPECIAL INSTRUCTIONS:',
    epcShareNone: 'None',
    epcNoPhoneTitle: 'No Phone Number',
    epcNoPhoneBody: 'Please edit and add a contact phone number first.',
    epcTitle: 'Caregiver Emergency Passcard',
    epcSubTitle: 'For Babysitters, Teachers & First Responders',
    epcAgeProfile: 'Age {age} · Neurodiverse Communication Profile',
    epcEditSectionTitle: 'Edit Passcard Information',
    epcLabelContactName: 'Emergency Contact Name',
    epcLabelContactPhone: 'Emergency Phone Number',
    epcLabelCommStyle: 'Communication Style',
    epcLabelTriggers: 'Sensory Triggers (comma separated)',
    epcLabelCalming: 'Calming Strategies (comma separated)',
    epcLabelAllergies: 'Allergies (comma separated)',
    epcLabelSpecial: 'Special Caregiver Instructions',
    epcPlaceholderContactName: 'e.g. Sarah (Mother)',
    epcPlaceholderContactPhone: 'e.g. +1 555-0199',
    epcPlaceholderCommStyle: 'How does your child express wants & needs?',
    epcPlaceholderTriggers: 'Loud noises, bright lights, crowds...',
    epcPlaceholderCalming: 'Headphones, deep hug, dim lights...',
    epcPlaceholderAllergies: 'Peanuts, Dairy, Latex...',
    epcPlaceholderSpecial: 'Any helpful tips for caregivers...',
    epcSavePasscard: 'Save Passcard',
    epcPrimaryContact: '🚨 PRIMARY EMERGENCY CONTACT',
    epcNoPhoneYet: 'No phone entered yet',
    epcCall: 'Call',
    epcPediatrician: 'Pediatrician / Therapist',
    epcDrClinicLine: 'Dr. {name} · {clinic}',
    epcHowICommunicate: 'How I Communicate',
    epcSensoryTriggers: 'Sensory Triggers',
    epcWhatCalms: 'What Calms Me Down',
    epcAllergiesNotes: 'Allergies & Medical Notes',
    epcAllergiesLabel: 'Allergies: ',
    epcCaregiverNotesLabel: 'Caregiver Notes: ',
    epcEditBtn: 'Edit Passcard',
    epcShareBtn: 'Share / Print',
    // WordEditor
    weCameraPermission: 'Camera permission is needed.',
    weSavingPhoto: 'Saving photo…',
    weGalleryPermission: 'Photo library permission is needed.',
    weSavingPicture: 'Saving picture…',
    weDownloading: 'Downloading…',
    weDownloadFailed: 'Could not download that picture.',
    weMicPermission: 'Microphone permission is needed to record a voice.',
    weTypeWordFirst: 'Type a word first.',
    weDeleteWordTitle: 'Delete "{word}"?',
    weDelete: 'Delete',
    weEditWord: 'Edit word',
    weAddWord: 'Add word',
    weFindPicture: 'Find a picture',
    weWordPhrase: 'Word / phrase',
    wePicture: 'Picture',
    weVoice: 'Voice',
    weTileSize: 'Tile size',
    weTileColor: 'Tile color',
    wePlaceholderWord: 'e.g. juice',
    wePlaceholderEmoji: 'or type an emoji',
    wePlaceholderSearch: 'Search word…',
    weCamera: 'Camera',
    weGallery: 'Gallery',
    weSearch: 'Search',
    weRemove: 'Remove',
    wePreview: 'Preview',
    weReRecord: 'Re-record',
    weStop: 'Stop',
    weRecordVoice: 'Record a voice',
    weStopRecording: 'Stop recording',
    weVoiceNoteRecorded: 'The child hears the recorded voice.',
    weVoiceNoteTts: 'The child hears the built-in speaking voice.',
    weUseTtsInstead: 'Use text-to-speech instead of the recording',
    weSaveChanges: 'Save changes',
    weAddToBoard: 'Add to board',
    weSourceOpenSymbols: 'OpenSymbols (59k+)',
    weSourcePhotosKey: 'Photos (key)',
    talk: 'Talk',
    home: 'Home',
    buildSentence: 'Tap pictures to build a sentence…',
    speakSentence: 'Speak sentence',
    removeLast: 'Remove last word',
    clearSentence: 'Clear sentence',
    makeAWord: 'Make a word',
    emptyFolder: 'This folder is empty. Add words with the mic button, or in the Board editor.',
    sayTheWord: 'Say the word out loud',
    sayTheWordHint: 'Tap the microphone, say one word, then tap it again to stop.',
    tapToStart: 'Tap to start',
    listeningTap: 'Listening… tap to stop',
    checkTheWord: 'Is this the right word?',
    checkTheWordHint: 'Speech can be misheard. Fix it here before continuing.',
    typeTheWord: 'type the word…',
    hearIt: 'Hear it',
    nextFindPicture: 'Next — find a picture',
    pickPicture: 'Pick a picture',
    pickPictureHint: 'These are searched pictures. Choose the clearest one, or take your own photo.',
    symbols: 'Symbols',
    photos: 'Photos',
    aiMade: 'AI made',
    camera: 'Camera',
    gallery: 'Gallery',
    useSymbol: 'Use symbol',
    tryAgain: 'Try again',
    useThisPicture: 'Use this picture',
    whichFolder: 'Which folder does it go in?',
    newFolder: 'New folder',
    createSave: 'Create & save',
    wordAdded: 'Word added',
    wordAddedHint: 'The child hears it spoken by the app when they tap the tile.',
    addAnother: 'Add another',
    done: 'Done',
    skipTypeInstead: 'Skip — type the word instead',
    step: 'Step',
    of: 'of',
    reopenForLanguage: 'Please close and reopen the app to finish switching the language and text direction.',
    games: 'Games',
    progress: 'Progress',
    gScore: 'Score', gStreak: 'Streak', gAccuracy: 'Accuracy', gRound: 'Round', gCorrect: 'Correct!', gTryAgain: 'Try again',
    gChooseGame: 'Choose a game', gRounds: 'rounds', gComplete: 'complete!', gPlayAgain: 'Play again', gBestStreak: 'best streak',
    gAnimalMatch: 'Animal Match', gAnimalMatchSub: 'Match the animal to its name',
    gLearnLetters: 'Learn Letters', gLearnLettersSub: 'Tap the letter you see',
    gLearnNumbers: 'Learn Numbers', gLearnNumbersSub: 'Tap the number you see',
    gColors: 'Colors', gColorsSub: 'Name the color you see',
    gShapes: 'Shapes', gShapesSub: 'Name the shape you see',
    gEmotions: 'Emotions', gEmotionsSub: 'How is this face feeling?',
    gFood: 'Food & Snacks', gFoodSub: 'Name the food you see',
    gPuzzle: 'Memory Puzzle', gPuzzleSub: 'Find the matching pairs', gAccuracyLabel: 'Accuracy', gCompletedChallenge: '{name} completed the {game} challenge!',
    gSequence: 'Number Sequence', gSequenceSub: 'Tap the numbers in order', gTapNumberN: 'Tap number {n}',
    gJigsaw: 'Picture Jigsaw', gJigsawSub: 'Put each piece in its own spot', gJigsawHint: 'Pick a piece below, then tap its matching spot',
    gSort: 'Category Sort', gSortSub: 'Sort each picture into the right group', gSortHint: 'Which group does this belong to?',
    gSortAnimalsBin: '🐾 Animals', gSortFoodBin: '🍎 Food',
    gGreatJob: 'Great job!', gYouFinished: 'You finished! Amazing work!',
    exploreMoreGames: 'EXPLORE MORE LEARNING GAMES', playingBadge: 'Playing', exercisesSuffix: 'Exercises',
    starsEarnedLabel: 'Stars Earned', bestStreakLabel: 'Best Streak',
    gListen: 'Listen', gChoicesLabel: 'Choices:', gEasyChoice: '2 (Easy)', gStandardChoice: '3 (Standard)',
    dpTodaysPracticeTitle: "Today's Practice", dpTodaysPracticeCardsLeft: '{n} cards left today',
    dpTodaysPracticeDone: 'All done for today! ✨',
    dlHeaderTitle: 'Daily Lesson', dlListenPrompt: 'Listen, then tap the picture', dlPicturePrompt: 'What is this called?',
    dlMatchPrompt: 'Find the matching picture', dlBuildPrompt: 'Tap to say it',
    dlSessionDoneTitle: 'Great practice today!', dlSessionDoneSub: '{n} of {n} cards done',
    dlNoCardsToday: 'Nothing to practice right now — check back later!', dlCardOfTotal: 'Card {i} of {n}',
    skSkillRequesting: 'Requesting', skSkillGreetingSocial: 'Greeting & Social', skSkillFeelingsBody: 'Feelings & Body',
    skSkillFoodDrink: 'Food & Drink', skSkillPeopleFamily: 'People & Family', skSkillDailyRoutine: 'Daily Routine',
    skSkillPlacesGoing: 'Places & Going',
    skLevel1Name: 'Single Word', skLevel2Name: 'Two Words', skLevel3Name: 'Short Phrase', skLevel4Name: 'Full Sentence',
    skPathTitle: 'Skill Path', skPathSub: 'Your progress across each communication skill',
    skLockedHint: 'Keep practicing to unlock this level', skMasteryLabel: 'Mastery', skLevelLabel: 'Level {n}',
    skNoWordsYet: 'No words in this skill yet', skUnlockedAnnounce: 'New level unlocked!', skPracticeBtn: 'Practice this skill',
    lsModalTitle: 'Learning Settings', lsDifficultyLabel: 'Difficulty', lsDifficultyEasy: 'Easy (2 choices)', lsDifficultyMedium: 'Medium (3 choices)', lsDifficultyHard: 'Hard (4 choices)',
    lsLessonLengthLabel: 'Daily lesson length', lsNewWordsLabel: 'New words per day', lsNewWordsOff: 'Off (review only)', lsCardTypesLabel: 'Card types',
    lsTypeListenTap: 'Listen & Tap', lsTypePictureWord: 'Picture → Word', lsTypeMatchPair: 'Match Pair', lsTypeBuildIt: 'Build It',
    lsTtsSpeedLabel: 'Speech speed', lsTtsSlow: 'Slow', lsTtsNormal: 'Normal',
    lsReduceMotionNote: 'Animation is controlled by "Reduce Motion" in Settings & Language.',
    lsSkillOverridesLabel: 'Manual skill level (overrides automatic progress)', lsOverrideAuto: 'Automatic', lsSaveBtn: 'Save',
    docMilestoneTitle: 'Clinical Milestone Evaluation',
    docMilestoneInitiator: 'Active Communication Initiator', docMilestoneInitiatorDesc: '{n} cumulative word events',
    docMilestoneLexical: 'Lexical Diversity (10+ unique words)', docMilestoneLexicalDesc: '{n} unique cards used',
    docMilestoneMultiWord: 'Multi-Word Sentence Builder', docMilestoneMultiWordDesc: 'Max length: {n} words',
    docMilestoneRoutine: 'Routine Consistency (70%+ adherence)', docMilestoneRoutineDesc: 'Average: {n}% daily completion',
    rptTitle: 'Angel Talk Weekly Report', rptDaysPracticed: 'Days practiced this week', rptCurrentStreak: 'Current streak',
    rptDaysUnit: 'days', rptNewWords: 'New words introduced', rptWordsRetained: 'Words now retained',
    rptEstPracticeTime: 'Estimated practice time', rptMinUnit: 'min', rptSkillMastery: 'Skill mastery:',
    rptLevelWord: 'Level', rptNeedsMorePractice: 'Needs more practice:',
    rptThisWeekCardTitle: 'This Week — Learning', rptShareBtn: 'Share Weekly Report', rptNoStrugglingWords: 'Nothing needs extra practice right now.',
    docSkillMasteryTitle: 'Skill Mastery', docAttemptHistoryTitle: 'Attempt History', docAttemptHistoryEmpty: 'No practice attempts logged yet.',
    docExportHistoryBtn: 'Export', docTrendTitle: '8-Week Mastery Trend', docTrendEmpty: 'Trend data builds up over time — check back in a future week.',
    docAttemptCorrect: 'Correct', docAttemptRetry: 'Needed retries',
    vpHeaderTitle: 'Voice Practice', vpPrivacyNote: 'Recordings stay on this device only — nothing is ever uploaded.',
    vpRecordHint: 'Listen, then tap the mic and say it!', vpRecordingLabel: 'Recording…', vpPlaybackLabel: 'Listen to yourself!',
    vpDonePracticingBtn: 'Done Practicing', vpNoWords: 'Nothing to practice right now — check back later!',
    vpMicDenied: 'Microphone access is needed to record.', vpTapToHear: 'Tap to hear the word',
    vpRecordingsTitle: 'Voice Recordings', vpRecordingsEmpty: 'No voice recordings yet.',
    vpDeleteAllBtn: 'Delete All Recordings', vpDeleteAllConfirmTitle: 'Delete all recordings?',
    vpDeleteAllConfirmMsg: 'This removes every saved voice practice clip for this child. This cannot be undone.',
    vpDeleteOneConfirmTitle: 'Delete this recording?', vpStorageUsedLabel: 'Voice recordings storage used',
    vpDoctorReadOnlyNote: 'Read-only — recordings are managed by the parent in Parent Hub.',
    setVoiceStorageLabel: 'Voice practice recordings (all children)', setVoiceStorageManageHint: 'Manage or delete per child in Parent Hub.',
    tmHeaderTitle: 'Tell Me', tmHint: 'Tap a picture to say it', tmChooseIntentTitle: 'What do you want to say?',
    tmNoWordsYet: 'No pictures ready yet — ask a parent to add some in Sentence Frame Editor.',
    sfeModalTitle: 'Sentence Frame Editor', sfeCurrentSentenceLabel: 'Current sentence', sfeLockIntentLabel: 'Lock to one sentence only',
    sfeAutomaticLabel: 'Automatic (both options shown if available)',
    sfeCustomTextLabel: 'Custom sentence (this language)', sfeCustomTextPlaceholder: 'Type the exact sentence to speak…',
    sfeClearOverrideBtn: 'Remove override',
    sfeUntaggedWordsTitle: 'Words without a sentence yet', sfeUntaggedWordsHint: 'Tag a custom word so it can say a full sentence too.',
    sfeWordTypeLabel: 'What kind of word is this?', sfeIntentLabel: 'What should it say?', sfeTagBtn: 'Save Tag', sfeNoUntaggedWords: 'Every word already has a sentence set up.',
    sfWtPlace: 'A place', sfWtObject: 'A thing', sfWtPerson: 'A person', sfWtFood: 'Food or drink', sfWtVerb: 'An action', sfWtFeeling: 'A feeling', sfWtNeed: 'A need', sfWtRoutine: 'A routine event',
    sfIntentRequest: 'I want it', sfIntentStatement: 'I am telling you about it', sfIntentFeeling: 'I feel this way', sfIntentPlan: 'I am going there', sfIntentRefusal: "I don't want to go there",
    tabOverview: 'Overview', tabTherapyGoals: 'Therapy Goals', tabCareJournal: 'Care Journal', tabPasscard: 'Passcard',
    tabVocabulary: 'Vocabulary', tabSchedule: 'Schedule', tabPrivacy: 'Privacy', adminBadge: 'Admin',
    ageYearsEnrolledDays: '{age} years · enrolled {days} days',
    caregiverPasscardTitle: 'Caregiver Passcard', caregiverPasscardSub: 'Triggers, calming tips & emergency contacts',
    sensoryCalmerTitle: 'Sensory Calmer Toolkit', sensoryCalmerSub: '4-4-4-4 breathing bubble & 5-4-3-2-1 grounding',
    shareProgressTitle: 'Share Progress with Doctor / SLP', shareProgressSub: 'Export text update for WhatsApp, SMS or Email',
    summaryMetricsTitle: 'Summary metrics', totalWordTaps: 'Total word taps', uniqueWordsUsed: 'Unique words used', wordsThisWeek: 'Words this week',
    mostActiveDay: 'Most active day', consecutiveActiveDays: 'Consecutive active days', fullSentencesSpoken: 'Full sentences spoken',
    correctionsUndoUsed: 'Corrections / undo used', longestSentence: 'Longest sentence', wordsUnit: 'words', avgRoutineAdherence: 'Average routine adherence',
    dayMon: 'Mon', dayTue: 'Tue', dayWed: 'Wed', dayThu: 'Thu', dayFri: 'Fri', daySat: 'Sat', daySun: 'Sun',
    dayLetterM: 'M', dayLetterT: 'T', dayLetterW: 'W', dayLetterF: 'F', dayLetterS: 'S',
    wordsTappedPerDaySubtitle: 'Words tapped per day this week', wordsCountBadge: '{n} words',
    wordsCommunicatedOnDay: '{n} word{s} communicated on this day.',
    chartPeakLabel: 'Peak ({day}: {n}w)', chartDailyActivityLabel: 'Daily Activity', chartTodayLabel: 'Today ({day})',
    progressIndicatorsTitle: 'Progress indicators',
    checkBoardUsedOnce: 'Board used at least once', checkBoardUsedOnceDetail: '{n} cumulative word taps',
    checkVocabDiversity: 'Vocabulary diversity', checkVocabDiversityDetail: '{n} unique words used',
    checkConsistentSchedule: 'Consistent weekly schedule', checkConsistentScheduleDetail: 'Average {pct}% routine completion',
    checkMultiDayUse: 'Multi-day weekly use', checkMultiDayUseDetail: 'Active {n}/7 days',
    checkCumulativeVocab: 'Cumulative vocabulary volume', checkCumulativeVocabDetail: '{n}/250 cumulative word-tap target',
    tipNoWordsThisWeek: 'No words used this week — revisit the board.', tipProgressOnTrack: 'Progress tracking is within expected range.',
    wordSequenceLabel: '   (word sequence)',
    moreTitle: 'More', adminControlCenterTitle: 'Admin Control Center', adminControlCenterSub: 'AAC boards, child profiles, AI keys & analytics', adminBadgeShort: 'ADMIN',
    rowVoiceCommandMatch: 'Voice Command Match', rowCategoryBuilder: 'Category Builder', rowMyCategories: 'My Categories', rowPhraseLibrary: 'Phrase Library',
    rowContentReviewQueue: 'Content Review Queue', rowSentencePicture: 'Sentence Picture', rowMilestones: 'Milestones', rowCalmDown: 'Calm Down',
    rowDoctorPanel: 'Doctor Panel', rowAllChildren: 'All Children', rowSettingsLanguage: 'Settings & Language', switchChildLabel: 'Switch Child ({name})',
    patientsListBack: 'Patients List', doctorPanelSub: 'Clinical evaluation, therapy prescribing & patient metrics',
    patientHeaderLine: 'Patient: {name} ({age} yrs)', exportReportBtn: 'Export Report',
    enrolledPatientsCount: 'Enrolled Patients ({n})', selectPatientHint: 'Select a patient to inspect clinical records and prescribe therapy',
    noChildrenEnrolled: 'No children enrolled yet.',
    ageYrsBadge: '{age} yrs', weeklyWordsLabel: 'Weekly Words', therapyGoalsLabel: 'Therapy Goals',
    tabAZPerformance: 'A-Z Performance', tabTherapyGoalsShort: 'Therapy Goals', tabClinicalNotes: 'Clinical Notes', tabDoctorContact: 'Doctor Contact', tabContent: 'Content',
    metricTotalWordTaps: 'Total Word Taps', metricVocabDiversity: 'Vocabulary Diversity', metricSentencesSpoken: 'Sentences Spoken', metricRoutineAdherence: 'Routine Adherence',
    speechSentenceFormationTitle: 'Speech & Sentence Formation', longestVerbalCompositionSub: 'Longest verbal composition constructed by {name}:', wordsConstructedPrefix: '{n} words constructed:', noFullSentenceLogged: 'No full sentence logged yet.',
    sevenDayVolumeTitle: '7-Day Communicative Volume', topCommunicatedVocabTitle: 'Top Communicated Vocabulary', tapsUnit: 'taps', noVocabTapsYet: 'No vocabulary taps recorded yet.',
    iMadeMistake: 'I made a mistake', undoOrClearMsg: 'Undo the last word or clear all?', closeBtn: 'Close', undoLastWordBtn: 'Undo last word', clearAllBtn: 'Clear all', oopsBtn: 'Oops',
    registeredChildProfilesCount: '{n} registered child profile{s} · {stars} ⭐ earned', addBtnShort: 'Add',
    childrenCareDirectoryTitle: 'Children Care Directory', childrenCareDirectoryDesc: 'Select a child profile to activate their AAC communication board, edit therapy targets, or inspect emergency passcards.',
    enrollFirstChildHint: 'Tap the button below to enroll your first child with face recognition or photo.',
    removeChildTitle: 'Remove {name}?', removeChildMsg: 'This will delete their profile and communication logs.', removeBtnShort: 'Remove',
    ageLabelShort: 'Age {age}', enrolledSincePrefix: 'Enrolled {date} · {stars} ⭐ earned',
    metricWordsPerWeek: 'Words / Week', metricStreak: 'Streak', metricRoutineShort: 'Routine', metricFaceScan: 'Face Scan',
    faceScanActive: 'Active', faceScanOff: 'Off',
    launchBoardBtn: 'Launch Board', passcardBtnLabel: 'Passcard',
    quickAccess: 'QUICK ACCESS', todaySchedule: "TODAY'S SCHEDULE", communicateNow: 'Communicate Now', todaysSchedule: "Today's Schedule",
    playAGame: 'Play a Game', parentDashboard: 'Progress', levelDeveloping: 'Level: Developing', nextUp: 'Next up',
    starsLabel: 'Stars', dayStreak: 'Day streak', todayLabel: 'Today', moreStarsToLevel: 'more stars to level up',
    qCommunicate: 'Communicate', qPictureTalk: 'Picture Talk', qActivities: 'Activities',
    happeningNow: 'Happening now', nextLabel: 'Next', nowBadge: 'NOW',
    sBreakfast: 'Breakfast', sPlayTime: 'Play Time', sAacSession: 'AAC Session', sLunch: 'Lunch',
    sRestTime: 'Rest Time', sSkillActivity: 'Skill Activity',
    stDone: 'Done', stNow: 'Now', stUpcoming: 'Upcoming', tasksLabel: 'tasks', doneSpoken: 'Done!',
    pOverview: 'Overview', pVocabulary: 'Vocabulary', pSchedule: 'Schedule', pPrivacy: 'Privacy',
    pWordsWeek: 'words used this week', pAdherence: 'Schedule adherence', pGameStreak: 'Game streak (days)',
    pMilestones: 'Milestones', pRecommendations: 'Recommendations',
    pTotalWords: 'total words spoken', pDiffWords: 'different words', pMostActive: 'most active day', pWeekSummary: 'Week summary',
    pM1: 'First words spoken', pM2: '10 different words used', pM3: '80%+ routine adherence', pM4: '3-day game streak', pM5: '25 stars earned',
    pDaysActive: 'days active', pActive: 'Active',
    pDailyUsage: 'Daily AAC usage (words)', pMostUsed: 'Most used words', pWeeklyAdherence: 'Weekly adherence',
    pExportIep: 'Export IEP Report', pDataOnDevice: 'Data stored on this device',
    pMathOnly: '✓ Math embedding only — no photos', pOnDeviceOnly: '✓ On-device only — never transmitted',
    pFaceRecognition: 'Face recognition', pGeneralConsent: 'General consent',
    pConsented: 'Consented', pNotEnabled: 'Not enabled', pNotGiven: 'Not given', pDeleteFace: 'Delete face data',
    pNoWordsYet: 'No words spoken yet — usage appears here once the Speak board is used.',
    pTip1: 'Try a short AAC session each day to build vocabulary momentum.',
    pTip2: 'Routine adherence is low — review the visual schedule together each morning.',
    pTip3: 'Introduce 2–3 new words this week (feelings or question words work well).',
    pTip4: 'A quick daily game keeps learning consistent and builds a streak.',
    pTip0: 'Great consistency this week — keep the current routine going.',
    pTimes: 'times',
    setSpeech: 'Speech', setSpeakingSpeed: 'Speaking speed', setSlow: 'Slow', setNormal: 'Normal', setFast: 'Fast',
    setBoard: 'Board', setHaptics: 'Haptic feedback', setTilesPerRow: 'Tiles per row',
    setAccessibility: 'Accessibility', setKiosk: 'Kiosk mode', setLockOpen: 'Lock the app open',
    setKioskInfo: 'When on, the Android back button is blocked and the screen stays awake. To fully stop a child exiting, also turn on Screen Pinning (Android) or Guided Access (iPhone). Exiting kiosk mode inside the app asks for the passcode.',
    setParentControls: 'Parent controls', setChangePasscode: 'Change admin passcode', setSetPasscode: 'Set admin passcode',
    setState: 'Set', setNotSet: 'Not set', setPixabay: 'Pixabay image key (optional)',
    setBackup: 'Backup', setExport: 'Export', setRestore: 'Restore',
    pLegendExcellent: '≥ 80% Excellent', pLegendGood: '60–80% Good', pLegendNeeds: '< 60% Needs attention',
    pSummaryNone: "hasn't used the Speak board yet this week. Encourage a few AAC sessions to start building vocabulary insights.",
    pSummaryUsing: 'is using the AAC board consistently', pSummaryOften: 'most often with', pSummaryAnd: 'and',
    pRoutinesStrong: 'Daily routines are strong.', pRoutinesTrack: 'Daily routines are on track.', pRoutinesMore: 'Daily routines could use more consistency.',
    pSummaryTail: 'Consider encouraging more question words.',
    moodQuestion: 'HOW ARE YOU FEELING TODAY?', quickExpressHeading: 'QUICK EXPRESS COMMUNICATION',
    feelingTag: 'Feeling', sayIAmFeeling: 'I am feeling', bathroom: 'Bathroom',
    needHelpPhrase: 'I need help please!', needWaterPhrase: 'I want water please.',
    needBathroomPhrase: 'I need to use the bathroom.', pleaseStopPhrase: 'Please stop.',
    completedToday: '✓ Completed Today!', startExercise: 'Start Exercise →',
    therapyTargetBadge: "DOCTOR'S THERAPY TARGET", tapToPracticeNow: 'Tap to practice now',
    doctorsPlan: "Doctor's Plan", unitWords: 'words', viewFullSchedule: 'View Full Schedule',
    defaultSpeechGoalTitle: 'Speak 3 Words with AAC Board', doctorsDailyGoal: "Doctor's Daily Goal",
    visualRoutineSubtitle: 'Visual Routine & First-Then Guide', readAloudBtn: 'Read',
    activitiesCompletedSuffix: 'Activities Completed',
    statusCompleted: 'Completed ✓', statusHappeningNow: 'Happening Now', statusUpcoming: 'Upcoming',
    addCustomRoutineTask: '+ Add Custom Routine Task', addCustomRoutineActivity: 'Add Custom Routine Activity',
    activityNameLabel: 'Activity Name', activityNamePlaceholder: 'e.g. Speech Session, Brush Teeth, Playground…',
    scheduledTimeLabel: 'Scheduled Time', scheduledTimePlaceholder: 'e.g. 11:30',
    activityIconLabel: 'Activity Icon Emoji', addToScheduleBtn: 'Add to Schedule',
    firstThenBoardTitle: 'FIRST - THEN BOARD',
    firstThenSubtitle: 'A clear visual structure to help your child transition between activities.',
    firstLabel: '1. FIRST', thenLabel: '2. THEN', activityFallback: 'Activity', rewardPlayFallback: 'Reward / Play',
    markFirstDoneBtn: 'Mark First Task as Done!',
    requiredAlertTitle: 'Required', requiredAlertMsg: 'Please enter a task name.',
    rightNowTimeFor: 'Right now, it is time for:', allTasksFinished: 'All tasks are finished for today! Wonderful job!',
    finishedGreatJob: '. Finished! Great job!',
    namePlaceholder: 'e.g. Ali, Sara, Ahmed', agePlaceholder: 'e.g. 5', selectAllThatApply: '(select all that apply)',
    faceCaptureFailed: "Couldn't capture your face. Try again.",
    capturingEllipsis: 'Capturing…', captureBtn: 'Capture', finishBtn: 'Finish!',
    hasBeenAdded: 'has been added!', faceUnlockHint: 'They can now unlock the app with face recognition.',
    startWithChild: 'Start with', doneCheck: '✓ Done', addAnotherChild: 'Add another child',
    positionFaceHint: 'Position your face in the circle', holdSteadyHint: 'Hold steady, looking for you… 😊',
    noChildEnrolled: 'No child enrolled yet.', checkingFaceEllipsis: 'Checking face…',
    adjustingLighting: 'Adjusting lighting (Attempt {n}/3)…',
    didntCatchFace: "Didn't catch the face", cameraNotAvailable: 'Camera not available',
    scanningFaceEllipsis: 'Scanning Face…', lookedEverywhere: 'Looked everywhere!', cameraUnavailableMsg: 'Camera unavailable',
    scanAgainBtn: 'Scan Again', selectChildBtn: 'Select Child', continueWithoutCamera: 'Continue Without Camera',
    selectChildProfileBtn: '👦 Select Child Profile', adminPortalBtn: '🛠️ Admin Portal',
    chooseChildProfileTitle: 'Choose Child Profile', tapChildProfileHint: "Tap your child's profile to open their session:",
    ageLabel: 'Age', welcomeBack: 'Welcome back, {name}! 🎉',
    cbHeaderTitle: 'Category Builder', cbReviewTitle: 'Review & Save',
    cbHeaderSubInput: 'Create a whole category at once', cbHeaderSubReview: '{name} · {count} words',
    cbCommandLabel: 'Command', cbCommandPlaceholder: 'e.g. "Make a category of animals with 40 animals"',
    cbListLabel: 'Or paste a word list (optional)', cbListPlaceholder: 'Cat\nDog\nRabbit\nHorse ...',
    cbQuickStart: 'Quick start', cbGenerateBtn: 'Generate category',
    cbHint: 'Images use built-in picture icons and work fully offline. Real illustrated images turn on automatically once an image provider is configured.',
    cbCategoryNameLabel: 'Category name', cbGeneratingImages: 'Generating images…',
    cbApproveSaveBtn: 'Approve & save {count} words', cbEditWordTitle: 'Edit word',
    cbLabelField: 'Label', cbSpokenPhraseField: 'Spoken phrase',
    cbNothingToAddTitle: 'Nothing to add', cbTryBuiltIn: 'Try a built-in category or paste a word list.',
    cbHeadsUpTitle: 'Heads up', cbAddWordFirst: 'Add at least one word first.',
    cbCategoryCreatedSpeech: '{name} category created with {count} words',
    rFirstStar: 'First Star!', rFiveStars: 'Star Collector', rTenStars: 'Star Champion',
    rTwentyStars: 'Superstar!', rFiftyStars: 'Legend!', rExplorer: 'Explorer',
    rReader: 'Bookworm', rHelper: 'Helpful Friend', rChildAchievements: "{name}'s achievements",
    rPlusOneStar: '+1 Star', rBadgesEarnedSuffix: 'Earned', rComingSoon: 'Coming Soon',
    rMoreStars: '+{n} more', rNeededSuffix: 'needed',
    cdAgain: '🔄 Again', cdBegin: '▶ Begin', cdStop: '■ Stop',
    cdTip: '💡 Breathe in through your nose… hold gently… breathe out slowly through your mouth',
    avThinkingCreatePic: 'Creating a picture…', avCouldNotCreatePic: 'Could not create a picture.',
    avThinkingSavePic: 'Saving picture…', avCouldNotSavePic: 'Could not save that picture.',
    avThinkingListening: 'Listening…', avMicPermission: 'Microphone permission is needed to speak a word.',
    avThinkingFindPics: 'Finding pictures…', avCouldNotDownloadPic: 'Could not download that picture. Try another.',
    avCameraPermission: 'Camera permission is needed.', avThinkingSavePhoto: 'Saving photo…',
    avGalleryPermission: 'Photo library permission is needed.', avTypeWordFirst: 'Type a word first.',
    avAiHint: 'AI-made pictures use OpenAI. Add a key in Settings — the button is ready for it.',
    avFolderNamePlaceholder: 'Folder name', avDefaultCategoryName: 'New Category',
    pmTitle: 'Phrase Library', pmTotal: 'Total', pmMatched: 'Matched', pmCategories: 'Categories',
    pmSearchPlaceholder: 'Search phrases or labels…', pmAllCategories: 'All Categories',
    pmAllLevels: 'All Levels', pmLevelN: 'Level {n}', pmNoMatch: 'No phrases match the current filters.',
    pmNoMatchHint: 'Tap "+" to add a new phrase, or adjust the filters above.',
    pmCardSub: '{category} · {count} trigger phrases', pmGalleryPermission: 'Camera roll permission is needed to choose images.',
    pmCameraPermission: 'Camera permission is needed to take a photo.', pmLabelRequired: 'A label is required.',
    pmUncategorized: 'Uncategorized', pmRemovePhraseTitle: 'Remove phrase?',
    pmRemovePhraseMsg: '"{label}" will be removed from the library.', pmRemove: 'Remove',
    pmEditPhrase: 'Edit Phrase', pmAddNewPhrase: 'Add New Phrase', pmTakePhoto: '📷 Take Photo',
    pmGallery: '🖼️ Gallery', pmLabelField: 'Label', pmLabelPlaceholder: 'What is spoken / shown',
    pmTriggerPhrasesLabel: 'Trigger phrases (comma separated)',
    pmTriggerPhrasesPlaceholder: 'e.g. "book on table, on top of table, book is on the table"',
    pmCategoryLabel: 'Category', pmCategoryPlaceholder: 'Prepositions, Food…', pmLevelLabel: 'Level 1–5',
    pmSourceBookLabel: 'Source book (optional)', pmSourceBookPlaceholder: 'For provenance / attribution',
    pmLicenseLabel: 'License reference (optional)', pmLicensePlaceholder: 'CC BY 4.0, etc.',
    pmImagePreview: 'Image preview',
    crqTitle: 'Content Review', crqPending: 'Pending', crqApproved: 'Approved', crqRejected: 'Rejected', crqAll: 'All',
    crqInfoText: 'Auto-extracted content from licensed sources (e.g. GDL, CC-BY) appears here. Approve → publishes to the Phrase Library. Reject → discarded.',
    crqNothingToShow: 'Nothing to show.', crqEmptyPending: 'The review queue is empty.',
    crqEmptyOther: 'Change the status filter above to see other entries.',
    crqSourceLicense: 'Source: {source} · License: {license}', crqCategoryLevel: 'Category: {category} · Level {level}',
    crqApprove: 'Approve', crqEdit: 'Edit', crqReject: 'Reject', crqClear: 'Clear',
    crqAlreadyReviewedTitle: 'Already reviewed', crqAlreadyReviewedMsg: 'This entry has already been processed.',
    crqApprovePublishTitle: 'Approve and publish?', crqApprovePublishMsg: '"{label}" will be published to the child-facing Phrase Library.',
    crqRejectTitle: 'Reject this entry?', crqRejectMsg: 'Source: {source}',
    crqDeleteRecordTitle: 'Delete record?', crqDeleteRecordMsg: 'Removes this queue entry permanently; already-published Phrase Library items are unaffected.',
    crqDelete: 'Delete', crqGalleryPermission: 'Camera roll permission needed.', crqCameraPermission: 'Camera permission needed.',
    crqEditTitle: 'Edit Before Review', crqImagePickHint: 'Tap to pick an image, or use the buttons below',
    crqCameraBtn: '📷 Camera', crqGalleryBtn: '🖼️ Gallery', crqDetectedPhrase: 'Detected phrase',
    crqDetectedPhrasePlaceholder: 'The phrase as detected', crqAltVariations: 'Alternate variations (comma separated)',
    crqAltVariationsPlaceholder: 'Optional alternate wordings', crqSuggestedLabel: 'Suggested label (spoken on match)',
    crqSuggestedLabelPlaceholder: 'Child-visible label', crqCategoryLabel: 'Category', crqCategoryPlaceholder: 'Prepositions, Greetings…',
    crqLevelLabel: 'Level 1–5', crqSourceLabel: 'Source / provenance', crqSourcePlaceholder: 'Book / page / extractor context',
    crqLicenseLabel: 'License (attribution)', crqLicensePlaceholder: 'CC BY 4.0, etc.',
    crqReviewerNote: 'Reviewer note (optional)', crqReviewerNotePlaceholder: 'Internal notes (not shown to child)',
    vcmTitle: 'Voice Match', vcmBreadcrumb: 'Say a phrase — the matching picture will appear.',
    vcmTapMic: 'Tap the microphone to speak', vcmTrySaying: 'Try saying: "book on table", "under the table", "near".',
    vcmListening: 'Listening…', vcmListeningPlaceholder: 'Listening… 🎙️', vcmCancel: 'Cancel',
    vcmMatchingVoice: 'Matching voice…', vcmHeardPrefix: 'Heard: "{text}"',
    vcmCategoryLabel: 'Category', vcmLevelLabel: 'Level', vcmPlayAgain: 'Play label again',
    vcmNoMatchTitle: "I don't know that phrase yet.", vcmNoMatchSub: 'Try saying something like "on the table" or tap a sample below.',
    vcmErrorTitle: 'Could not process speech', vcmErrorDefault: 'Please try speaking again.',
    vcmPracticeTitle: 'Practice Phrases (tap to test):', vcmStartSpeaking: '🎙️  Start Speaking',
    vcmMatching: 'Matching…', vcmTryAnother: '🎙️  Try Another', vcmDoneSpeaking: 'Done Speaking (Match)',
    vcmClearResult: 'Clear result', vcmVoiceUnavailable: 'Voice recording is not available. Please grant microphone permissions.',
    vcmMicStartFail: 'Could not start microphone. Check microphone permissions.',
    vcmSampleOnTable: 'on the table', vcmSampleUnderTable: 'under the table', vcmSampleInSomething: 'in something',
    vcmSampleAboveTable: 'above the table', vcmSampleNearTable: 'near the table',
    mcWordsCount: '{count} words', mcAddWord: 'Add word', mcSortAZ: 'Sort A–Z', mcGroups: 'Groups',
    mcRecordedVoice: '🎙️ recorded voice', mcTextToSpeech: '🔊 text-to-speech',
    mcMoveHint: 'Tap a word to edit its picture and voice. Use the arrows to reorder.',
    mcFolderTitle: 'Folder', mcFolderNamePlaceholder: 'Folder name',
    mcDeleteFolderTitle: 'Delete "{name}"?', mcDeleteFolderMsg: '{count} words (and any sub-folders) will be removed.',
    mcDelete: 'Delete', mcNothingToExport: 'Nothing to export yet.', mcBackupShareTitle: 'Angel Talk categories backup',
    mcInvalidBackupJson: "That doesn't look like valid backup JSON.", mcRestoreCompleteTitle: 'Restore complete',
    mcRestoredWithWarningsTitle: 'Restored with warnings', mcRestoreSummary: '{cats} categories · {words} words · {images} images',
    mcMyCategoriesTitle: 'My Categories', mcCaregiverMade: '{count} caregiver-made', mcAddWordByVoice: 'Add word by voice',
    mcDefaultFolderName: 'New Folder', mcNewFolder: 'New folder', mcBulkBuild: 'Bulk build',
    mcExportBackup: 'Export / backup', mcImport: 'Import',
    mcEmptyFolders: 'No folders yet. Tap "New folder" to start, or "Bulk build" to generate one.',
    mcHiddenFromChild: ' · hidden from child', mcPasteBackupTitle: 'Paste backup JSON', mcRestore: 'Restore',
    mcAddSubCategory: 'Add sub-category', mcSubCategories: 'Sub-categories',
    mcAddSubCategoryTitle: 'Add to {name}', mcSubCategoryPlaceholder: 'e.g. Weekend',
    mcFindWord: 'Find a word', mcColWord: 'Word', mcColUseCount: 'Use count', mcColLastUsed: 'Last used',
    mcTimesCount: '{count} times', mcNotYet: 'Not yet', mcNoWordsMatch: 'No words match your search.',
    admLoading: 'Loading Admin Control Center…', admTabBoards: 'AAC Boards', admTabChildren: 'Children',
    admTabContent: 'Content', admTabSettings: 'System & AI', admTabAnalytics: 'Analytics',
    admHeaderTitle: 'Admin Control Center', admSuperAdmin: 'SUPER ADMIN',
    admHeaderSubtitle: 'Manage AAC Boards, Children, AI Keys & Clinical Logs',
    admCategoriesTitle: 'Categories & Boards', admCategoriesSubtitle: '{count} categories · Click any to view/edit cards',
    admAddCategory: 'Add Category', admTotalTiles: '{count} Total Vocabulary Tiles', admAddCardBtn: '+ Card',
    admSearchCardsPlaceholder: 'Search cards in this category…', admNoCardsFound: 'No cards found in this category.',
    admAddFirstCard: '+ Add First Card',
    admSyncTitle: 'Auto-Sync Board Language', admSyncDesc: 'Translate all default school and sentence cards to the active language ({lang}).',
    admSyncNow: 'Sync Now',
    admRequired: 'Required', admEnterCategoryName: 'Please enter a category name.', admSuccess: 'Success',
    admCategoryCreated: 'Category "{name}" created.',
    admDeleteCategoryTitle: 'Delete Category?', admDeleteCategoryMsg: 'Are you sure you want to delete "{name}" and its {count} cards?',
    admDelete: 'Delete',
    admDeleteCardTitle: 'Delete Card?', admDeleteCardMsg: 'Delete "{label}" from this category?',
    admChildrenTitle: 'Child & Patient Records', admChildrenSubtitle: '{count} registered profiles with adaptive AI settings',
    admEnrollChild: 'Enroll Child', admAgeEnrolled: 'Age: {age} yrs · Enrolled: {date}', admNoDiagnoses: 'No specific diagnoses selected',
    admSetActive: 'Set Active', admEditRecord: 'Edit Record', admNoChildren: 'No children profiles enrolled yet.',
    admEnrollFirstChild: '+ Enroll First Child',
    admInvalidInput: 'Invalid Input', admInvalidNameAge: 'Please enter a valid name and age.',
    admSaved: 'Saved', admProfileUpdated: 'Profile for {name} updated.',
    admDeleteChildTitle: 'Delete {name}?', admDeleteChildMsg: 'This will remove the profile and face records. This cannot be undone.',
    admDeleteProfile: 'Delete Profile',
    admContentTitle: 'Content & Illustration Pipeline', admContentSubtitle: 'ARASAAC, OpenSymbols, and clean sensory illustration library',
    admReviewQueue: 'Review Queue',
    admArasaacTitle: 'ARASAAC Official', admArasaacDesc: 'Verified Aragonese Portal of Augmentative and Alternative Communication pictograms.',
    admIntegratedCached: 'Integrated & Cached',
    admOpenSymbolsTitle: 'OpenSymbols / Mulberry', admOpenSymbolsDesc: '59,000+ open-licensed pediatric clinical communication symbols.',
    admReadyOnDemand: 'Ready on Demand',
    admCacheTitle: 'Local Cache Maintenance', admCacheDesc: 'Clears downloaded image memory and temporary photo buffers without deleting word cards.',
    admClearCache: 'Clear Cache', admCacheCleaned: 'Cache Cleaned', admCacheCleanedMsg: 'Temporary image cache cleared.',
    admSettingsTitle: 'System & AI Engines', admSettingsSubtitle: 'API credentials, speech synthesis, language & security lock',
    admApiKeysTitle: 'Cloud AI & Search API Keys', admOpenAiKeyLabel: 'OpenAI API Key (DALL-E & Whisper STT)',
    admAiConfigured: '✓ Active AI engine is configured.', admAiOptional: 'Optional: Offline demo works without a key.',
    admPixabayKeyLabel: 'Pixabay Search API Key', admPixabayPlaceholder: 'Pixabay API key…',
    admSpeechEngineTitle: 'Speech & Audio Engine', admVoiceTest: 'Voice Test ({lang})', admSpeechRateLabel: 'Speech rate: {rate}x',
    admPlaying: 'Playing…', admTestVoice: 'Test Voice',
    admSpeechPreset: 'Speech Speed Preset', admPresetSlow: 'Slow (0.65x)', admPresetNormal: 'Normal (0.9x)', admPresetFast: 'Fast (1.0x)',
    admSoundFx: 'Audio Sound Effects', admHaptics: 'Tactile Haptic Feedback', admLanguageTitle: 'Active Interface Language',
    admSecurityTitle: 'Admin Security & Kiosk Lock', admSetPin: 'Set 4-Digit Admin Passcode', admPinPlaceholder: 'e.g. 1234',
    admUpdatePin: 'Update PIN', admKioskLock: 'Kiosk Board Lock',
    admKioskDesc: 'Prevents exiting AAC screen without the 5-tap corner PIN code.',
    admBackupTitle: 'Backup & Data Portability',
    admBackupDesc: 'Export or restore all custom categories, words, and board modifications in JSON format.',
    admExportJson: 'Export JSON', admImportJson: 'Import JSON',
    admOpenAiKeySaved: 'OpenAI API key saved successfully.', admPixabayKeySaved: 'Pixabay API key saved successfully.',
    admInvalidPin: 'Invalid PIN', admPinDigitsMsg: 'PIN must be exactly 4 numeric digits.',
    admPinSavedTitle: 'Security PIN Saved', admPinSavedMsg: 'Admin passcode updated successfully.',
    admPasteBackupJson: 'Please paste the backup JSON.', admRestoredMsg: 'Restored {cats} categories and {words} words.',
    admError: 'Error', admBackupInvalidStruct: 'Could not validate backup JSON structure.',
    admInvalidJsonTitle: 'Invalid JSON', admInvalidJsonMsg: 'The provided text is not valid JSON.',
    admSyncBoardLangTitle: 'Sync Board Languages', admSyncBoardLangMsg: 'Translate seed cards to current app language ({lang})?',
    admTranslate: 'Translate', admCompleted: 'Completed', admSeedTranslated: 'Seed board translated.',
    admAnalyticsTitle: 'Clinical Usage & Analytics', admAnalyticsSubtitle: 'Real-time communication metrics across all registered children',
    admReport: 'Report', admExportCsv: 'Export CSV',
    admReportTemplate: 'Angel Talk Clinical Analytics Report\nGenerated: {date}\nChildren: {children}\nWeekly Word Taps: {taps}\nSentences Constructed: {sentences}\nRoutine Adherence: {routine}%\nTop Words: {topWords}',
    admEnrolledPatients: 'Enrolled Patients', admWeeklyWordTaps: 'Weekly Word Taps', admSentencesSpoken: 'Sentences Spoken',
    admAvgAdherence: 'Avg Schedule Adherence',
    admTopVocab: 'Top Vocabulary Words', admTapsSuffix: '{count} taps',
    admNoWordEvents: 'No word tap events logged yet. Tap cards on the AAC board to populate metrics.',
    admNewCategoryTitle: 'Create New AAC Category', admNewCategorySubtitle: 'Add a new communication tab for your patient or classroom',
    admCategoryNameLabel: 'Category Name', admCategoryNamePlaceholder: 'e.g. Playground, Mealtime…',
    admCategoryIconLabel: 'Category Icon Emoji', admCreateCategory: 'Create Category',
    admEditChildTitle: 'Edit Child Record', admEditChildSubtitle: 'Update diagnostic criteria and target goals',
    admChildNameLabel: 'Child Name', admAgeYearsLabel: 'Age (Years)',
    admDensityLabel: 'Button Grid Density (Crescendo Progressive Ladder)',
    admDensityBeginner: '1 (Beginner)', admDensityDense: '35+ (Dense)',
    admPageStyleLabel: 'Page-Set Organization Style', admCategoryFolders: 'Category Folders',
    admCategoryFoldersSub: 'Avaz / TouchChat hierarchy', admFixedCoreGrid: 'Fixed Core Grid',
    admFixedCoreGridSub: 'LAMP / Proloquo motor memory',
    admDiagnosesTagsLabel: 'Diagnoses Tags', admSaveChanges: 'Save Changes',
    admBackupModalTitle: 'JSON Backup & Restore', admBackupModalSubtitle: 'Paste backup JSON code below to restore system state:',
    admPasteJsonPlaceholder: 'Paste backup JSON string here...', admCloseBtn: 'Close', admRestoreData: 'Restore Data',
    docRequiredGoalMsg: 'Please enter a valid goal title and target count.', docGoalSuccessMsg: 'Therapy goal prescribed and assigned to child.',
    docDeleteGoalTitle: 'Delete Goal?', docDeleteGoalMsg: 'Remove this therapy goal?', docDelete: 'Delete', docCancel: 'Cancel',
    docRequiredNoteMsg: 'Please provide a note title and consultation content.', docNoteSavedMsg: 'Clinical consultation note added to medical record.',
    docDeleteNoteTitle: 'Delete Note?', docDeleteNoteMsg: 'Remove this consultation note?',
    docContactUpdatedTitle: 'Updated', docContactUpdatedMsg: 'Doctor and therapy contact details saved.',
    docPhoneCallTitle: 'Phone Call', docCallMsg: 'Call {phone}', docEmailTitle: 'Email', docEmailMsg: 'Email {email}',
    docTherapyCatSpeech: 'Speech & AAC', docTherapyCatSensory: 'Sensory & Calm',
    docTherapyCatOccupational: 'Occupational Routine', docTherapyCatBehavioral: 'Behavioral & Social',
    docPrescribedGoalsTitle: 'Prescribed Therapy Goals',
    docPrescribedGoalsSub: 'Assigned exercises for speech, sensory regulation & occupational routines',
    docPrescribeGoal: 'Prescribe Goal', docCompletedBadge: 'COMPLETED', docInProgress: 'IN PROGRESS',
    docPrescribedByLine: 'Prescribed by: {doctor} · Assigned: {date}', docProgressLabel: 'Progress:', docIncrementPrefix: '+1',
    docNoGoalsYet: 'No therapy goals prescribed yet.', docPrescribeFirstGoal: '+ Prescribe First Goal',
    docConsultationNotesTitle: 'Consultation Notes & IEP',
    docConsultationNotesSub: 'Therapy logs, developmental milestones, and specialist notes',
    docAddNote: 'Add Note', docByAuthorDate: 'By {author} · {date}', docKeyRecommendations: 'Key Recommendations:',
    docNoNotesYet: 'No consultation notes recorded yet.', docAddClinicalObservation: '+ Add Clinical Observation',
    docContactTitle: 'Doctor & Therapist Contact',
    docContactSub: 'Direct medical contact for parent guidance & clinical inquiries',
    docEditContact: 'Edit Contact', docCallDoctor: 'Call Doctor', docEmailClinic: 'Email Clinic', docShareIep: 'Share IEP',
    docClinicalInstructions: 'Clinical Instructions for Caregivers:',
    docPermissionsInfo: '✅ Toggle content categories on/off. Only approved categories will be displayed to {name}.',
    docEnableAll: 'Enable all', docDisableAll: 'Disable all',
    docPrescribeGoalModalTitle: 'Prescribe Therapy Target', docPrescribeGoalModalSub: 'Assign speech, sensory or occupational exercise',
    docGoalTitleLabel: 'Goal Title', docGoalTitlePlaceholder: 'e.g. Speak 5 Words in Picture Talk',
    docTherapyCategoryLabel: 'Therapy Category', docTargetCountLabel: 'Target Count', docUnitLabel: 'Unit (e.g. words, times)',
    docPrescribingClinicianLabel: 'Prescribing Clinician', docPrescribingClinicianPlaceholder: 'e.g. Dr. Sarah Mitchell',
    docAssignGoal: 'Assign Goal',
    docAddNoteModalTitle: 'Add Clinical Consultation Note', docAddNoteModalSub: 'Record progress, assessment, and care recommendations',
    docNoteTitleLabel: 'Note Title', docNoteTitlePlaceholder: 'e.g. Bi-Weekly Speech Language Assessment',
    docAttendingDoctorLabel: 'Attending Doctor / Specialist', docDoctorNamePlaceholder: 'Doctor Name',
    docClinicalObservationLabel: 'Clinical Observation & Assessment',
    docClinicalObservationPlaceholder: 'Patient demonstrates improved joint attention and uses 3-card sentence strip consistently...',
    docCaregiverRecsLabel: 'Caregiver Recommendations (One per line)',
    docCaregiverRecsPlaceholder: 'Practice food requests during dinner\nLimit sensory screen time before bed',
    docSaveConsultation: 'Save Consultation',
    docEditDoctorProfileTitle: 'Edit Doctor & Clinic Profile', docEditDoctorProfileSub: 'Contact information visible to parents',
    docDoctorNameLabel: 'Doctor / Clinician Name', docClinicalSpecialityLabel: 'Clinical Speciality',
    docClinicNameLabel: 'Hospital or Clinic Name', docPhoneLabel: 'Phone / Helpline', docEmailLabel: 'Email Address',
    docConsultingHoursLabel: 'Consulting Hours & Instructions', docSaveContact: 'Save Contact',
    docDefaultDoctorName: 'Dr. Sarah Mitchell, SLP', docDefaultSpeciality: 'Speech-Language Pathologist',
    docDefaultClinicName: 'Pediatric Developmental Therapy Center',
    docDefaultContactNotes: 'Available Mon-Thu 09:00 - 16:00 for speech consultations.',
    docDefaultDisplayNotes: 'Consulting hours: Mon–Thu 09:00 - 16:00. Call for therapy updates.',
    docReportTemplate: '=====================================================\nANGEL TALK CLINICAL THERAPY & ASSESSMENT REPORT\n=====================================================\nPatient: {patient}\nAge: {age} years\nDiagnoses: {diagnoses}\nEnrolled: {enrolled}\nReport Date: {reportDate}\n\nATTENDING DOCTOR / CLINICIAN:\n{doctorLine}\nClinic: {clinicName}\nContact: {phone} | {email}\n\nA-TO-Z COMMUNICATION PERFORMANCE METRICS:\n-----------------------------------------------------\n• Cumulative Words Communicated: {totalWords} word taps\n• Unique Vocabulary Diversity: {uniqueCount} unique words\n• Full Sentences Constructed: {sentencesSpoken} sentences\n• Longest Sentence Spoken: {longestLen} words\n  Verbatim Words: "{verbatim}"\n• Visual Routine Adherence: {avgAdherence}% average\n• Consecutive Days Active: {consecutiveDays} days\n\nTOP COMMUNICATIVE VOCABULARY:\n-----------------------------------------------------\n{topWords}\n\nPRESCRIBED THERAPY GOALS:\n-----------------------------------------------------\n{activeGoals}\n\nCLINICAL NOTES & OBSERVATIONS:\n-----------------------------------------------------\n{recentNotes}\n=====================================================',
    docNoVocabDataRecorded: 'No vocabulary data recorded yet.', docNoGoalsAssignedYet: 'No specific therapy goals assigned yet.',
    docNoNotesLoggedYet: 'No clinical consultation notes logged yet.',
    docOccurrencesSuffix: '{count} occurrences', docRecommendationsPrefix: 'Recommendations: ',
    docDefaultRecommendation: 'Continue daily AAC picture board practice', docDoctorFallback: 'Doctor',
    psFamilySection: 'FAMILY & CHILDREN PROFILES', psManageProfiles: 'Manage {count} registered child profile(s)',
    psEnrolledBadge: '{count} Enrolled', psEnrollSubtitle: 'Enroll child with camera face scan or photo',
    psClinicalSection: 'CLINICAL & THERAPY MANAGEMENT', psDoctorPanelSub: 'Prescribe IEP goals, view A-to-Z performance metrics',
    psClinicalBadge: 'Clinical',
    psAdminTitle: 'Admin Control Center', psAdminSub: 'AAC boards, AI API keys, CSV analytics export',
    psPinProtectedBadge: 'PIN Protected',
    psContentSection: 'AAC BOARD & CONTENT STUDIO', psCategoryBuilderTitle: 'Category & Card Builder',
    psCategoryBuilderSub: 'Create custom vocabulary folders & upload symbols',
    psSentencePictureTitle: 'Sentence Picture Talk', psSentencePictureSub: 'AI-assisted voice-to-picture communication builder',
    psSystemSection: 'SYSTEM & ACCESSIBILITY', psAccessibilitySub: 'Language, speech synthesis speed, kiosk security',
    psParentAreaBadge: 'Parent Area', psHeaderSub: 'Caregiver & Clinical Administration Hub',
    psWelcomeCaregiver: 'Welcome, Caregiver!', psChildrenConfigured: '{count} child(ren) configured · {stars} ⭐ earned across boards',
    psChildrenLabel: 'Children', psActiveStatus: 'Active', psOfflineAac: 'Offline AAC', psIepReady: 'IEP Ready',
    psReturnToScanner: 'Return to Face Recognition Scanner',
    spExample1: 'The black cat is under the table', spExample2: 'A small brown dog is behind the big tree',
    spExample3: 'Three red apples are in the basket', spExample4: 'The blue bird is above the house',
    spExample5: 'The girl is sitting on the chair',
    spNoPollinationsToken: 'Real pictures need a free Pollinations token (auth.pollinations.ai) in .env — the built scene is shown for now.',
    spEngineSlow: 'The picture engine is slow — the built scene is still shown.',
    spNoAiEngine: 'Live AI drawing needs a free Pollinations token (auth.pollinations.ai) in .env, or an OpenAI key. The instant scene and 14,800-word library still work.',
    spCouldNotMake: 'Could not make the picture.',
    spEngineTooLong: 'The picture engine is taking too long. Showing the instant scene — tap AI to try again.',
    spEngineNoResponse: 'The picture engine did not respond. Tap AI to try again.',
    spSpeakKeyboardTitle: 'Speak with the keyboard',
    spSpeakKeyboardMsg: 'Tap the text box and use the microphone on your keyboard — the picture updates as you talk.',
    spDidntCatchTitle: "Didn't catch that", spTryAgainType: 'Try again or type it.',
    spBadgeLibrary: 'Library', spBadgeLibraryNew: 'Library · new', spBadgeLibraryAi: 'Library · AI', spBadgeInstant: 'Instant',
    spHeaderTitle: 'Picture Talk', spHeaderSubWithLib: 'Picture library: {words} words · {books} from books{saved}',
    spHeaderSubSavedSuffix: ' · {n} saved', spHeaderSubDefault: 'Say or type a sentence — the picture builds as you talk',
    spUnderstanding: 'Understanding…', spMakingPicture: 'Making the picture…',
    spKeepTalkingOn: 'Keep-talking mode ON', spStartOver: 'Start over', spRedraw: 'Redraw', spRealPicture: 'Real picture',
    spMicHintAgent: 'Speak naturally — the {agent} agent understands full sentences. "cat under the table", "a girl is crying next to the mosque", "move the book behind the chair", "remove the cat". "Real picture" turns the whole scene into one AI drawing.',
    spMicHintNoAgent: 'One change at a time: "table" · "cat under the table" · "open the cat\'s eyes" · "a girl is crying". Add EXPO_PUBLIC_GROQ_API_KEY for free-speech understanding.',
    spInstantScene: 'Instant scene', spMakeFullPicture: 'Make full picture with AI',
    spUnderstoodWell: 'Understood well', spPartlyUnderstood: 'Partly understood',
    spUnderstoodSuffix: '· {pct}% — tap "AI" for anything the instant scene can\'t draw.',
    spTypeSentencePlaceholder: 'Type a sentence, or tap the mic on your keyboard…',
    spListeningTapStop: 'Listening… tap to stop', spTurningSpeechToText: 'Turning speech into text…', spSpeakSentence: 'Speak a sentence',
    spKeyboardMicHint2: "Or tap the text box and use your keyboard's microphone — the picture updates word by word.",
    spReadAloud: 'Read aloud', spClear: 'Clear', spTrySentence: 'Try a sentence', spScienceConcepts: 'Science concepts',
    spBigHint: 'The instant scene works offline and is always the base. "AI" uses a free image engine (no key needed); a sharper engine turns on if you connect an OpenAI key with ✨. Understood: colours, sizes (small / big), counts, things ({things}…), actions (running, sitting…), positions (under, on, above, behind, in front of, beside, inside), objects ({objects}…).',
    spModalTitle: 'Sharper AI pictures (optional)',
    spModalBody: 'The free AI engine already works with no key. Paste an OpenAI API key here for higher-quality illustrations. It is stored only on this device. Leave blank and save to disconnect.',
    spKeyPlaceholder: 'sk-…',
    spFlowerLabel: 'Flower', spSeedsLabel: 'Seeds', spFlowerAbsent: 'no flower', spSeedsAbsent: 'no seeds',
    spBackboneHighlighted: 'Backbone highlighted', spNoBackbone: 'No backbone',
    accKioskOption2Title: 'Kiosk Mode — Option 2 (Recommended)', accBestEffortLock: 'Best-effort in-app lock (always active):',
    accBackDisabled: '• Android hardware Back button is disabled',
    accScreenAwake: '• Screen stays awake as long as the child is in the app',
    accExitTempBullet: '• To exit temporarily from any child screen: tap the very top-right corner of the screen 5 times in a row. A passcode prompt will appear.',
    accAndroidHardenedTitle: 'Android — hardened device-owner mode (dedicated devices):',
    accInstallApkBullet: '• Install the Angel Talk APK first, then provision the device as device-owner via ADB or your MDM:',
    accToggleKioskBullet: '• After provisioning, toggle "Kiosk" above — the app will use Android lock-task mode to block Home, Overview, and Settings.',
    accFactoryResetBullet: '• Requires the device to be unprovisioned / factory-reset before the first APK install.',
    accIosGuidedTitle: 'iOS (iPad/iPhone) — Guided Access (required — no app can force this):',
    accIosSettingsBullet: '• Open iOS Settings → Accessibility → Guided Access → turn ON',
    accIosPasscodeBullet: "• Set a Guided Access passcode (separate from this app's passcode)",
    accIosLaunchBullet: '• Launch Angel Talk, triple-click the side button, tap Guided Access → Start',
    accIosExitBullet: '• To exit, triple-click again and enter the iOS Guided Access passcode',
    accPasscodeModalTitle: 'Admin passcode', accPasscodeModalBody: '4 digits. Leave blank and save to remove the passcode.',
    accPasscodePlaceholder: '••••',
    accPixabayModalTitle: 'Pixabay API key',
    accPixabayModalBody: 'Free key from pixabay.com/api/docs. Enables photo search in the word editor. AAC symbol search works without it.',
    accPixabayPlaceholder: 'paste key…',
    accRestoreModalTitle: 'Restore from backup', accRestoreModalBody: 'Paste the backup text. This replaces the current board.',
    accRestorePlaceholder: '{ ... }', accRestoreBtn: 'Restore',
    accPasscodeInvalid: 'Passcode must be exactly 4 digits.', accNothingToBackup: 'Nothing to back up yet.',
    accInvalidBackupText: 'That is not valid backup text.',
    accRestoreCompleteTitle: 'Restore complete', accRestoreWarningsTitle: 'Restored with warnings',
    accRestoreSummary: '{cats} folders · {words} words · {images} pictures',
    vcmBookLabel: 'BOOK',
    hubTitle: 'Angel Talk Hub',
    activeChildLabel: 'Active child: {name}',
    mainAppsSection: 'MAIN APPS & TABS',
    homeHub: 'Home Hub',
    aacTalkBoard: 'AAC Talk Board',
    dailyRoutineSchedule: 'Daily Routine Schedule',
    speechLearningGames: 'Speech & Learning Games',
    doctorProgressReports: 'Doctor & Progress Reports',
    parentClinicalToolsSection: 'PARENT & CLINICAL TOOLS',
    visualSocialStoriesTitle: 'Visual Social Stories',
    visualSocialStoriesDesc: 'Read-aloud guides for dentist, haircut, school & emotions',
    addChildProfileTitle: 'Add Child Profile',
    addChildProfileDesc: 'Enroll child with face recognition, age & diagnosis',
    myCategoriesWordsTitle: 'My Categories & Words',
    myCategoriesWordsDesc: 'Organize shelves, words, hide/show & delete',
    categoryBuilderGenTitle: 'Category Builder & Generator',
    categoryBuilderGenDesc: 'Build new categories from lists or AI presets',
    voiceCommandMatchTitle: 'Voice Command Match',
    voiceCommandMatchDesc: 'Practice spoken phrases with live visual matching',
    phraseLibraryTitle: 'Phrase Library',
    phraseLibraryDesc: 'Manage trigger phrases, speech levels & targets',
    contentReviewQueueTitle: 'Content Review Queue',
    contentReviewQueueDesc: 'Review, approve or reject vocabulary entries',
    parentPortalAddTitle: 'Parent Portal & Add Child',
    parentPortalAddDesc: 'Child enrollment, facial recognition & profiles',
    settingsAccessibilityTitle: 'Settings & Accessibility',
    settingsAccessibilityDesc: 'Speech speed, PIN lock, backups & audio options',
        switchChildFaceTitle: 'Switch Child / Face Login',
    switchChildFaceDesc: 'Log in another child profile via camera scan',
    caregiverSpaceBadge: 'CAREGIVER SPACE',
    shapeVocabTitle: 'Shape their vocabulary',
    shapeVocabDesc: 'Keep everyday words close, add new shelves, and notice what helps communication flow.',
    voiceAddBtn: 'Voice add',
    bulkAddBtn: 'Bulk add',
    addWordBtn: '+ Add word',
    shelvesHeader: 'Shelves',
    shelvesSub: 'Organize words in a way that feels familiar.',
    newShelfBtn: 'New shelf',
    editSubCatPill: 'Edit sub-category',
    editShelfPill: 'Edit shelf',
    findAWordPlaceholder: 'Find a word',
    colWord: 'WORD',
    colUseCount: 'USE COUNT',
    colLastUsed: 'LAST USED',
    colActions: 'ACTIONS',
    timesUsed: '{count} times',
    lastUsedToday: 'Today',
    lastUsedNotYet: 'Not yet',
    hiddenFromChildNote: 'Hidden from child',
    noWordsInShelfTitle: 'No words in this shelf',
    noWordsInShelfSub: 'Tap "+ Add word" above to add vocabulary to {name}.',
    addSubCategorySidebar: 'Add sub-category',
    wordsInSubCatMeta: '{count} words · in sub-category "{name}"',
    wordsInShelfAllMeta: '{count} words · in "{name}" (all sub-categories)',
    wordsOnDeviceMeta: '{count} words · used on this device',
    hiddenShelfNote: ' · (Hidden from child)',
    deleteConfirmTitle: 'Delete {type}',
    deleteConfirmMsg: 'Are you sure you want to delete "{name}"?',
    confirmDeleteBtn: 'Delete',
    cancelBtn: 'Cancel',
    saveChangesBtn: 'Save changes',
  },
  'ar-SA': {
    appName: 'أنجل توك',
    scanning: 'أبحث عنك…',
    welcome: 'أهلاً!',
    parentSetup: 'إعداد الوالدين',
    addChild: 'إضافة طفل',
    childName: 'اسم الطفل',
    childAge: 'العمر',
    diagnosis: 'الاحتياجات',
    save: 'حفظ',
    cancel: 'إلغاء',
    next: 'التالي',
    back: 'رجوع',
    schedule: 'يومي',
    aacBoard: 'لوحة التحدث',
    rewards: 'نجومي',
    calmDown: 'هدّئ نفسك',
    settings: 'الإعدادات',
    parentHub: 'جميع الأطفال',
    doctorPanel: 'لوحة الطبيب',
    breatheIn: 'شهيق',
    breatheOut: 'زفير',
    hold: 'انتظر',
    wellDone: 'أحسنت! ⭐',
    stars: 'نجوم',
    badges: 'شارات',
    speak: 'تحدث',
    clear: 'مسح',
    fontSize: 'حجم الخط',
    highContrast: 'تباين عالٍ',
    sound: 'الصوت',
    reduceMotion: 'تقليل الحركة',
    language: 'اللغة',
    enrollFace: 'تسجيل الوجه',
    lookAtCamera: 'انظر إلى الكاميرا 😊',
    capturingFace: 'تم! 📸',
    matchFound: 'وجدتك!',
    noMatch: 'صديق جديد!',
    hello: 'مرحبا',
    morning: 'صباح الخير',
    afternoon: 'مساء الخير',
    evening: 'مساء النور',
    night: 'تصبح على خير',
    content: 'تعلمي',
    doctorApproved: 'موافق من الطبيب',
    selectLanguage: 'اختر لغتك',
    parentPin: 'منطقة الوالدين',
    myDay: 'يومي',
    breatheStart: 'اضغط الدائرة للبدء',
    feelingCalm: 'أشعر بالهدوء 🌿',
    tapToSpeak: 'اضغط صورة للكلام',
    sentence: 'جملتي:',
    needsCategory: 'احتياجات',
    feelingsCategory: 'مشاعر',
    peopleCategory: 'أشخاص',
    actionsCategory: 'أفعال',
    foodCategory: 'طعام',
    scanningMessage: 'انظر إلى الكاميرا',
    enrollStep1: 'الخطوة 1: انظر مباشرة',
    enrollStep2: 'الخطوة 2: استدر قليلاً',
    enrollStep3: 'الخطوة 3: استدر للجهة الأخرى',
    childAdded: 'تم إضافة الطفل! 🎉',
    noChildren: 'لا أطفال بعد. أضف واحداً!',
    deleteChild: 'حذف',
    editChild: 'تعديل',
    allowedContent: 'المحتوى المسموح',
    hello_child: 'مرحبا',
    appKioskExitTitle: 'خروج المشرف من وضع الكشك',
    appKioskExitBody: 'أدخل رمز المرور المكوّن من 4 أرقام للخروج من وضع الكشك لمدة 5 دقائق.',
    appExitPasscodePrompt: 'أدخل رمز المرور المكوّن من 4 أرقام.',
    appIncorrectPasscode: 'رمز المرور غير صحيح.',
    appEnterBtn: 'دخول',
    appKioskExitA11y: 'الخروج من وضع الكشك (5 نقرات)',
    pgBoardEditorTitle: 'محرر اللوحة',
    pgDefaultTitle: 'منطقة الوالدين',
    pgEnterPasscodeSub: 'أدخل رمز المرور المكوّن من 4 أرقام',
    pgWrongPasscode: 'رمز مرور خاطئ — حاول مرة أخرى',
    pgCreatePasscodeSub: 'أنشئ رمز مرور من 4 أرقام لحماية هذه المنطقة',
    pgConfirmPasscodeSub: 'أدخل نفس الأرقام الأربعة مرة أخرى للتأكيد',
    pgPasscodeMismatch: 'الرمزان غير متطابقين — حاول مرة أخرى',
    pgPasscodeCreated: 'تم تعيين رمز المرور!',
    qabMistake: 'خطأ',
    qabAttention: 'انتباه',
    scEmptyHint: 'قل أو اكتب جملة — تُبنى الصورة أثناء حديثك.',
    ssBodyTitle: 'أجزاء الجسم',
    ssAnatomyHint: 'قل "قلب"، "أضف الرئتين"، "أضف المعدة"... لبناء الرسم التوضيحي.',
    ssEmptyHint: 'قل شيئًا — "طاولة"، ثم "قطة فوق الطاولة"، ثم "افتح عيني القطة".',
    scmTitle: 'مجموعة الهدوء الحسي',
    scmSubTitle: 'تهدئة لطيفة للقلق والحمل الحسي الزائد',
    scmTabBreathing: 'فقاعة التنفس',
    scmTabGrounding: 'التأريض 5-4-3-2-1',
    scmTabAmbient: 'أصوات مهدئة',
    scmBreathingHeader: 'دليل التنفس المربّع 4-4-4-4',
    scmBreathingDesc: 'راقب الفقاعة وهي تتمدد وتنكمش لتهدئة الجهاز العصبي بلطف.',
    scmPhaseInhale: 'شهيق',
    scmPhaseHold: 'احبس',
    scmPhaseExhale: 'زفير',
    scmPhaseRest: 'راحة',
    scmTipInhale: 'تنفس ببطء من الأنف...',
    scmTipHold: 'احبس نفسك بلطف...',
    scmTipExhale: 'أخرج الزفير بهدوء من الفم...',
    scmTipRest: 'ابقَ ساكناً وهادئاً...',
    scmSeconds4: '4 ثوانٍ',
    scmPauseBubble: 'إيقاف الفقاعة',
    scmResumeRhythm: 'استئناف الإيقاع',
    scmGroundingHeader: 'التأريض الحسي 5-4-3-2-1',
    scmGroundingDesc: 'تقنية سريرية مثبتة تساعد الطفل على الابتعاد عن الضيق وإعادة الاتصال بحواسه الجسدية.',
    scmStepSee: 'أشياء يمكنك رؤيتها',
    scmStepTouch: 'أشياء يمكنك لمسها',
    scmStepHear: 'أصوات يمكنك سماعها',
    scmStepSmell: 'أشياء يمكنك شمّها',
    scmStepTaste: 'شيء يمكنك تذوقه',
    scmExSee: 'انظر حولك لترى 5 ألوان أو أشياء في الغرفة',
    scmExTouch: 'المس ملابسك أو الطاولة أو الوسادة أو يديك',
    scmExHear: 'استمع للمروحة أو العصافير أو التنفس أو الأصوات',
    scmExSmell: 'اشتم الهواء النقي أو الصابون أو قميصك',
    scmExTaste: 'خذ رشفة من الماء البارد أو ركّز على فمك',
    scmResetChecklist: 'إعادة ضبط قائمة التأريض',
    scmAmbientHeader: 'مشاهد صوتية حسية مهدئة',
    scmAmbientDesc: 'إخفاء صوتي ناعم ومستمر لتقليل تأثير الضوضاء البيئية المفاجئة.',
    scmSoundRainTitle: 'مطر خفيف',
    scmSoundRainDesc: 'مطر لطيف على الأوراق',
    scmSoundOceanTitle: 'أمواج المحيط',
    scmSoundOceanDesc: 'إيقاع الشاطئ البطيء',
    scmSoundWhiteTitle: 'ضوضاء بيضاء',
    scmSoundWhiteDesc: 'همسة خلفية ثابتة',
    scmSoundWindTitle: 'نسيم الغابة',
    scmSoundWindDesc: 'حفيف الأشجار والصنوبر',
    scmPlaying: 'قيد التشغيل',
    scmTapToPlay: 'اضغط للتشغيل',
    scmStopAll: 'إيقاف كل الأصوات',
    epcDefaultContactName: 'أحد الوالدين / الوصي',
    epcDefaultContactNameWithDoctor: 'جهة اتصال الطوارئ العائلية',
    epcDefaultCommStyle: 'يستخدم لوحة Angel Talk للتواصل، والإيماءات، والبطاقات المصورة.',
    epcDefaultTrigger1: 'الأصوات المفاجئة العالية',
    epcDefaultTrigger2: 'الإضاءة الفلورية الساطعة',
    epcDefaultTrigger3: 'الأماكن المزدحمة',
    epcDefaultTrigger4: 'اللمس غير المتوقع',
    epcDefaultCalm1: 'سماعات عازلة للضوضاء',
    epcDefaultCalm2: 'ضغط عميق / بطانية ثقيلة',
    epcDefaultCalm3: 'ركن هادئ خافت الإضاءة',
    epcDefaultCalm4: 'إعطاء لوحة التواصل للتعبير عن الاحتياجات',
    epcDefaultAllergy: 'لا توجد حساسية غذائية معروفة',
    epcDefaultDietary: 'لا يوجد',
    epcDefaultSpecial: 'يرجى عدم إجبار الطفل على التواصل البصري. تحدث بجمل قصيرة وهادئة.',
    epcSavedTitle: 'تم الحفظ',
    epcSavedBody: 'تم تحديث بطاقة مقدم الرعاية بنجاح.',
    epcCommFallback: 'يستخدم لوحة Angel Talk للتواصل',
    epcShareHeader: '🚨 بطاقة طوارئ مقدم الرعاية 🚨',
    epcShareChildLine: 'الطفل: {name} (العمر {age})',
    epcShareDiagnoses: 'الاحتياجات: {list}',
    epcShareContactHeader: '📞 جهة اتصال الطوارئ الرئيسية:',
    epcShareNotSet: 'غير محدد',
    epcShareDoctorLine: 'الطبيب: د. {name} ({phone})',
    epcShareCommHeader: '🗣️ كيف أتواصل:',
    epcShareTriggersHeader: '⚠️ المحفزات الحسية (أشياء تسبب لي الضيق):',
    epcShareCalmHeader: '💚 ما يساعدني على الهدوء:',
    epcShareAllergiesHeader: '🥜 الحساسية:',
    epcShareSpecialHeader: 'ℹ️ تعليمات خاصة:',
    epcShareNone: 'لا يوجد',
    epcNoPhoneTitle: 'لا يوجد رقم هاتف',
    epcNoPhoneBody: 'يرجى تعديل البطاقة وإضافة رقم هاتف لجهة الاتصال أولاً.',
    epcTitle: 'بطاقة طوارئ مقدم الرعاية',
    epcSubTitle: 'لمقدمي الرعاية والمعلمين والمستجيبين الأوائل',
    epcAgeProfile: 'العمر {age} · ملف تواصل ذوي الاحتياجات الخاصة',
    epcEditSectionTitle: 'تعديل معلومات البطاقة',
    epcLabelContactName: 'اسم جهة اتصال الطوارئ',
    epcLabelContactPhone: 'رقم هاتف الطوارئ',
    epcLabelCommStyle: 'أسلوب التواصل',
    epcLabelTriggers: 'المحفزات الحسية (مفصولة بفاصلة)',
    epcLabelCalming: 'استراتيجيات الهدوء (مفصولة بفاصلة)',
    epcLabelAllergies: 'الحساسية (مفصولة بفاصلة)',
    epcLabelSpecial: 'تعليمات خاصة لمقدم الرعاية',
    epcPlaceholderContactName: 'مثال: سارة (الأم)',
    epcPlaceholderContactPhone: 'مثال: 555-0199 971+',
    epcPlaceholderCommStyle: 'كيف يعبّر طفلك عن رغباته واحتياجاته؟',
    epcPlaceholderTriggers: 'ضوضاء عالية، أضواء ساطعة، ازدحام...',
    epcPlaceholderCalming: 'سماعات، عناق عميق، إضاءة خافتة...',
    epcPlaceholderAllergies: 'فول سوداني، ألبان، لاتكس...',
    epcPlaceholderSpecial: 'أي نصائح مفيدة لمقدمي الرعاية...',
    epcSavePasscard: 'حفظ البطاقة',
    epcPrimaryContact: '🚨 جهة اتصال الطوارئ الرئيسية',
    epcNoPhoneYet: 'لم يُدخل رقم هاتف بعد',
    epcCall: 'اتصال',
    epcPediatrician: 'طبيب الأطفال / المعالج',
    epcDrClinicLine: 'د. {name} · {clinic}',
    epcHowICommunicate: 'كيف أتواصل',
    epcSensoryTriggers: 'المحفزات الحسية',
    epcWhatCalms: 'ما يساعدني على الهدوء',
    epcAllergiesNotes: 'الحساسية والملاحظات الطبية',
    epcAllergiesLabel: 'الحساسية: ',
    epcCaregiverNotesLabel: 'ملاحظات مقدم الرعاية: ',
    epcEditBtn: 'تعديل البطاقة',
    epcShareBtn: 'مشاركة / طباعة',
    weCameraPermission: 'إذن الكاميرا مطلوب.',
    weSavingPhoto: 'جارٍ حفظ الصورة…',
    weGalleryPermission: 'إذن مكتبة الصور مطلوب.',
    weSavingPicture: 'جارٍ حفظ الصورة…',
    weDownloading: 'جارٍ التنزيل…',
    weDownloadFailed: 'تعذّر تنزيل هذه الصورة.',
    weMicPermission: 'إذن الميكروفون مطلوب لتسجيل صوت.',
    weTypeWordFirst: 'اكتب كلمة أولاً.',
    weDeleteWordTitle: 'حذف "{word}"؟',
    weDelete: 'حذف',
    weEditWord: 'تعديل كلمة',
    weAddWord: 'إضافة كلمة',
    weFindPicture: 'ابحث عن صورة',
    weWordPhrase: 'كلمة / عبارة',
    wePicture: 'صورة',
    weVoice: 'صوت',
    weTileSize: 'حجم البطاقة',
    weTileColor: 'لون البطاقة',
    wePlaceholderWord: 'مثال: عصير',
    wePlaceholderEmoji: 'أو اكتب رمزاً تعبيرياً',
    wePlaceholderSearch: 'ابحث عن كلمة…',
    weCamera: 'الكاميرا',
    weGallery: 'المعرض',
    weSearch: 'بحث',
    weRemove: 'إزالة',
    wePreview: 'معاينة',
    weReRecord: 'إعادة التسجيل',
    weStop: 'إيقاف',
    weRecordVoice: 'سجّل صوتاً',
    weStopRecording: 'إيقاف التسجيل',
    weVoiceNoteRecorded: 'يسمع الطفل الصوت المسجَّل.',
    weVoiceNoteTts: 'يسمع الطفل الصوت المدمج للتحدث.',
    weUseTtsInstead: 'استخدم تحويل النص إلى كلام بدلاً من التسجيل',
    weSaveChanges: 'حفظ التغييرات',
    weAddToBoard: 'أضف إلى اللوحة',
    weSourceOpenSymbols: 'OpenSymbols (+59 ألف)',
    weSourcePhotosKey: 'صور (مفتاح)',
    talk: 'تحدث',
    home: 'الرئيسية',
    buildSentence: 'اضغط الصور لتكوين جملة…',
    speakSentence: 'انطق الجملة',
    removeLast: 'حذف آخر كلمة',
    clearSentence: 'مسح الجملة',
    makeAWord: 'أنشئ كلمة',
    emptyFolder: 'هذا المجلد فارغ. أضف كلمات بزر الميكروفون أو من محرر اللوحة.',
    sayTheWord: 'انطق الكلمة بصوت عالٍ',
    sayTheWordHint: 'اضغط الميكروفون، قل كلمة واحدة، ثم اضغط مرة أخرى للتوقف.',
    tapToStart: 'اضغط للبدء',
    listeningTap: 'أستمع… اضغط للتوقف',
    checkTheWord: 'هل هذه الكلمة الصحيحة؟',
    checkTheWordHint: 'قد يُساء سماع الكلام. صحّحها هنا قبل المتابعة.',
    typeTheWord: 'اكتب الكلمة…',
    hearIt: 'استمع',
    nextFindPicture: 'التالي — ابحث عن صورة',
    pickPicture: 'اختر صورة',
    pickPictureHint: 'هذه صور من البحث. اختر أوضحها أو التقط صورتك.',
    symbols: 'رموز',
    photos: 'صور',
    aiMade: 'ذكاء اصطناعي',
    camera: 'الكاميرا',
    gallery: 'المعرض',
    useSymbol: 'استخدم رمزاً',
    tryAgain: 'حاول مجدداً',
    useThisPicture: 'استخدم هذه الصورة',
    whichFolder: 'في أي مجلد توضع؟',
    newFolder: 'مجلد جديد',
    createSave: 'إنشاء وحفظ',
    wordAdded: 'تمت إضافة الكلمة',
    wordAddedHint: 'يسمعها الطفل من التطبيق عند لمس البطاقة.',
    addAnother: 'أضف أخرى',
    done: 'تم',
    skipTypeInstead: 'تخطَّ — اكتب الكلمة بدلاً من ذلك',
    step: 'خطوة',
    of: 'من',
    reopenForLanguage: 'يرجى إغلاق التطبيق وإعادة فتحه لإكمال تغيير اللغة واتجاه النص.',
    games: 'ألعاب',
    progress: 'التقدم',
    gScore: 'النقاط', gStreak: 'التتابع', gAccuracy: 'الدقة', gRound: 'جولة', gCorrect: 'صحيح!', gTryAgain: 'حاول مجدداً',
    gChooseGame: 'اختر لعبة', gRounds: 'جولات', gComplete: 'اكتملت!', gPlayAgain: 'العب مجدداً', gBestStreak: 'أفضل تتابع',
    gAnimalMatch: 'طابق الحيوان', gAnimalMatchSub: 'طابق الحيوان مع اسمه',
    gLearnLetters: 'تعلم الحروف', gLearnLettersSub: 'اضغط الحرف الذي تراه',
    gLearnNumbers: 'تعلم الأرقام', gLearnNumbersSub: 'اضغط الرقم الذي تراه',
    gColors: 'الألوان', gColorsSub: 'سمِّ اللون الذي تراه',
    gShapes: 'الأشكال', gShapesSub: 'سمِّ الشكل الذي تراه',
    gEmotions: 'المشاعر', gEmotionsSub: 'بماذا يشعر هذا الوجه؟',
    gFood: 'الطعام والوجبات', gFoodSub: 'سمِّ الطعام الذي تراه',
    gPuzzle: 'لعبة الذاكرة', gPuzzleSub: 'ابحث عن الأزواج المتطابقة', gAccuracyLabel: 'الدقة', gCompletedChallenge: 'أكمل {name} تحدي {game}!',
    gSequence: 'ترتيب الأرقام', gSequenceSub: 'اضغط على الأرقام بالترتيب', gTapNumberN: 'اضغط على الرقم {n}',
    gJigsaw: 'أحجية الصورة', gJigsawSub: 'ضع كل قطعة في مكانها الصحيح', gJigsawHint: 'اختر قطعة من الأسفل، ثم اضغط على مكانها الصحيح',
    gSort: 'فرز الفئات', gSortSub: 'ضع كل صورة في مجموعتها الصحيحة', gSortHint: 'إلى أي مجموعة تنتمي هذه الصورة؟',
    gSortAnimalsBin: '🐾 حيوانات', gSortFoodBin: '🍎 طعام',
    gGreatJob: 'أحسنت!', gYouFinished: 'أنهيت! عمل رائع!',
    exploreMoreGames: 'اكتشف المزيد من الألعاب التعليمية', playingBadge: 'قيد اللعب', exercisesSuffix: 'تمارين',
    starsEarnedLabel: 'النجوم المكتسبة', bestStreakLabel: 'أفضل تتابع',
    gListen: 'استمع', gChoicesLabel: 'الخيارات:', gEasyChoice: '٢ (سهل)', gStandardChoice: '٣ (عادي)',
    dpTodaysPracticeTitle: 'تدريب اليوم', dpTodaysPracticeCardsLeft: '{n} بطاقات متبقية اليوم',
    dpTodaysPracticeDone: 'انتهيت من تدريب اليوم! ✨',
    dlHeaderTitle: 'الدرس اليومي', dlListenPrompt: 'استمع، ثم اضغط على الصورة', dlPicturePrompt: 'ما اسم هذا؟',
    dlMatchPrompt: 'ابحث عن الصورة المطابقة', dlBuildPrompt: 'اضغط لتقولها',
    dlSessionDoneTitle: 'أحسنت في تدريب اليوم!', dlSessionDoneSub: '{n} من {n} بطاقات',
    dlNoCardsToday: 'لا يوجد شيء للتدريب الآن — عد لاحقاً!', dlCardOfTotal: 'بطاقة {i} من {n}',
    skSkillRequesting: 'الطلب', skSkillGreetingSocial: 'التحية والتواصل الاجتماعي', skSkillFeelingsBody: 'المشاعر والجسم',
    skSkillFoodDrink: 'الطعام والشراب', skSkillPeopleFamily: 'الأشخاص والعائلة', skSkillDailyRoutine: 'الروتين اليومي',
    skSkillPlacesGoing: 'الأماكن والذهاب',
    skLevel1Name: 'كلمة واحدة', skLevel2Name: 'كلمتان', skLevel3Name: 'عبارة قصيرة', skLevel4Name: 'جملة كاملة',
    skPathTitle: 'مسار المهارات', skPathSub: 'تقدمك في كل مهارة تواصل',
    skLockedHint: 'استمر في التدريب لفتح هذا المستوى', skMasteryLabel: 'الإتقان', skLevelLabel: 'المستوى {n}',
    skNoWordsYet: 'لا توجد كلمات في هذه المهارة بعد', skUnlockedAnnounce: 'تم فتح مستوى جديد!', skPracticeBtn: 'تدرّب على هذه المهارة',
    lsModalTitle: 'إعدادات التعلم', lsDifficultyLabel: 'الصعوبة', lsDifficultyEasy: 'سهل (خياران)', lsDifficultyMedium: 'متوسط (٣ خيارات)', lsDifficultyHard: 'صعب (٤ خيارات)',
    lsLessonLengthLabel: 'طول الدرس اليومي', lsNewWordsLabel: 'كلمات جديدة يومياً', lsNewWordsOff: 'متوقف (مراجعة فقط)', lsCardTypesLabel: 'أنواع البطاقات',
    lsTypeListenTap: 'استمع واضغط', lsTypePictureWord: 'صورة ← كلمة', lsTypeMatchPair: 'طابق الزوج', lsTypeBuildIt: 'كوّنها',
    lsTtsSpeedLabel: 'سرعة الكلام', lsTtsSlow: 'بطيء', lsTtsNormal: 'عادي',
    lsReduceMotionNote: 'الحركة يتم التحكم بها من "تقليل الحركة" في الإعدادات واللغة.',
    lsSkillOverridesLabel: 'مستوى المهارة اليدوي (يتجاوز التقدم التلقائي)', lsOverrideAuto: 'تلقائي', lsSaveBtn: 'حفظ',
    docMilestoneTitle: 'تقييم المعالم السريرية',
    docMilestoneInitiator: 'مبادر تواصل نشط', docMilestoneInitiatorDesc: '{n} حدث كلمة تراكمي',
    docMilestoneLexical: 'تنوع لغوي (١٠+ كلمات فريدة)', docMilestoneLexicalDesc: '{n} بطاقة فريدة مستخدمة',
    docMilestoneMultiWord: 'بناء جمل متعددة الكلمات', docMilestoneMultiWordDesc: 'أقصى طول: {n} كلمة',
    docMilestoneRoutine: 'انتظام الروتين (التزام ٧٠٪+)', docMilestoneRoutineDesc: 'المتوسط: {n}٪ إتمام يومي',
    rptTitle: 'تقرير Angel Talk الأسبوعي', rptDaysPracticed: 'أيام التدريب هذا الأسبوع', rptCurrentStreak: 'التتابع الحالي',
    rptDaysUnit: 'أيام', rptNewWords: 'كلمات جديدة تم تقديمها', rptWordsRetained: 'كلمات تم إتقانها',
    rptEstPracticeTime: 'الوقت التقديري للتدريب', rptMinUnit: 'دقيقة', rptSkillMastery: 'إتقان المهارات:',
    rptLevelWord: 'المستوى', rptNeedsMorePractice: 'يحتاج إلى مزيد من التدريب:',
    rptThisWeekCardTitle: 'هذا الأسبوع — التعلم', rptShareBtn: 'مشاركة التقرير الأسبوعي', rptNoStrugglingWords: 'لا شيء يحتاج إلى تدريب إضافي الآن.',
    docSkillMasteryTitle: 'إتقان المهارات', docAttemptHistoryTitle: 'سجل المحاولات', docAttemptHistoryEmpty: 'لم يتم تسجيل أي محاولات تدريب بعد.',
    docExportHistoryBtn: 'تصدير', docTrendTitle: 'اتجاه الإتقان خلال ٨ أسابيع', docTrendEmpty: 'بيانات الاتجاه تتراكم مع الوقت — راجع مرة أخرى في أسبوع قادم.',
    docAttemptCorrect: 'صحيح', docAttemptRetry: 'احتاج إعادة محاولة',
    vpHeaderTitle: 'تدريب النطق', vpPrivacyNote: 'التسجيلات تبقى على هذا الجهاز فقط — لا يتم رفعها أبداً.',
    vpRecordHint: 'استمع، ثم اضغط على الميكروفون وقلها!', vpRecordingLabel: 'جارٍ التسجيل…', vpPlaybackLabel: 'استمع إلى صوتك!',
    vpDonePracticingBtn: 'انتهيت من التدريب', vpNoWords: 'لا يوجد شيء للتدريب الآن — عد لاحقاً!',
    vpMicDenied: 'يلزم إذن الوصول إلى الميكروفون للتسجيل.', vpTapToHear: 'اضغط لسماع الكلمة',
    vpRecordingsTitle: 'تسجيلات الصوت', vpRecordingsEmpty: 'لا توجد تسجيلات صوتية بعد.',
    vpDeleteAllBtn: 'حذف كل التسجيلات', vpDeleteAllConfirmTitle: 'حذف كل التسجيلات؟',
    vpDeleteAllConfirmMsg: 'سيؤدي هذا إلى إزالة كل تسجيل صوتي محفوظ لهذا الطفل. لا يمكن التراجع عن هذا.',
    vpDeleteOneConfirmTitle: 'حذف هذا التسجيل؟', vpStorageUsedLabel: 'مساحة تخزين تسجيلات الصوت المستخدمة',
    vpDoctorReadOnlyNote: 'للقراءة فقط — يدير الوالد التسجيلات من مركز الوالدين.',
    setVoiceStorageLabel: 'تسجيلات تدريب النطق (كل الأطفال)', setVoiceStorageManageHint: 'يمكن الإدارة أو الحذف لكل طفل من مركز الوالدين.',
    tmHeaderTitle: 'قل لي', tmHint: 'اضغط على صورة لتقولها', tmChooseIntentTitle: 'ماذا تريد أن تقول؟',
    tmNoWordsYet: 'لا توجد صور جاهزة بعد — اطلب من أحد الوالدين إضافة بعضها من محرر الجمل.',
    sfeModalTitle: 'محرر الجمل', sfeCurrentSentenceLabel: 'الجملة الحالية', sfeLockIntentLabel: 'قصر على جملة واحدة فقط',
    sfeAutomaticLabel: 'تلقائي (يظهر الخياران إذا توفرا)',
    sfeCustomTextLabel: 'جملة مخصصة (بهذه اللغة)', sfeCustomTextPlaceholder: 'اكتب الجملة المطلوبة بالضبط…',
    sfeClearOverrideBtn: 'إزالة التخصيص',
    sfeUntaggedWordsTitle: 'كلمات بدون جملة بعد', sfeUntaggedWordsHint: 'صنّف كلمة مخصصة لتتمكن من قول جملة كاملة أيضاً.',
    sfeWordTypeLabel: 'ما نوع هذه الكلمة؟', sfeIntentLabel: 'ماذا يجب أن تقول؟', sfeTagBtn: 'حفظ التصنيف', sfeNoUntaggedWords: 'كل الكلمات لديها جملة معدة بالفعل.',
    sfWtPlace: 'مكان', sfWtObject: 'شيء', sfWtPerson: 'شخص', sfWtFood: 'طعام أو شراب', sfWtVerb: 'فعل', sfWtFeeling: 'شعور', sfWtNeed: 'حاجة', sfWtRoutine: 'حدث روتيني',
    sfIntentRequest: 'أريده', sfIntentStatement: 'أخبرك عنه', sfIntentFeeling: 'أشعر بهذا', sfIntentPlan: 'أنا ذاهب إلى هناك', sfIntentRefusal: 'لا أريد الذهاب إلى هناك',
    tabOverview: 'نظرة عامة', tabTherapyGoals: 'أهداف العلاج', tabCareJournal: 'يوميات الرعاية', tabPasscard: 'بطاقة الطوارئ',
    tabVocabulary: 'المفردات', tabSchedule: 'الجدول', tabPrivacy: 'الخصوصية', adminBadge: 'المشرف',
    ageYearsEnrolledDays: '{age} سنوات · مسجَّل منذ {days} يوم',
    caregiverPasscardTitle: 'بطاقة الطوارئ لمقدم الرعاية', caregiverPasscardSub: 'المحفزات ونصائح التهدئة وجهات اتصال الطوارئ',
    sensoryCalmerTitle: 'أدوات التهدئة الحسية', sensoryCalmerSub: 'فقاعة تنفس ٤-٤-٤-٤ وتأريض ٥-٤-٣-٢-١',
    shareProgressTitle: 'شارك التقدم مع الطبيب / أخصائي النطق', shareProgressSub: 'تصدير تحديث نصي عبر واتساب أو رسالة نصية أو بريد إلكتروني',
    summaryMetricsTitle: 'ملخص المقاييس', totalWordTaps: 'إجمالي نقرات الكلمات', uniqueWordsUsed: 'الكلمات الفريدة المستخدمة', wordsThisWeek: 'الكلمات هذا الأسبوع',
    mostActiveDay: 'اليوم الأكثر نشاطاً', consecutiveActiveDays: 'أيام النشاط المتتالية', fullSentencesSpoken: 'الجمل الكاملة المنطوقة',
    correctionsUndoUsed: 'التصحيحات / التراجع المستخدم', longestSentence: 'أطول جملة', wordsUnit: 'كلمات', avgRoutineAdherence: 'متوسط الالتزام بالروتين',
    dayMon: 'إثنين', dayTue: 'ثلاثاء', dayWed: 'أربعاء', dayThu: 'خميس', dayFri: 'جمعة', daySat: 'سبت', daySun: 'أحد',
    dayLetterM: 'ن', dayLetterT: 'ث', dayLetterW: 'ر', dayLetterF: 'ج', dayLetterS: 'س',
    wordsTappedPerDaySubtitle: 'الكلمات المنقورة يومياً هذا الأسبوع', wordsCountBadge: '{n} كلمة',
    wordsCommunicatedOnDay: 'تم التواصل بـ {n} كلمة في هذا اليوم.',
    chartPeakLabel: 'الذروة ({day}: {n} كلمة)', chartDailyActivityLabel: 'النشاط اليومي', chartTodayLabel: 'اليوم ({day})',
    progressIndicatorsTitle: 'مؤشرات التقدم',
    checkBoardUsedOnce: 'تم استخدام اللوحة مرة واحدة على الأقل', checkBoardUsedOnceDetail: '{n} نقرة كلمات تراكمية',
    checkVocabDiversity: 'تنوع المفردات', checkVocabDiversityDetail: '{n} كلمة فريدة مستخدمة',
    checkConsistentSchedule: 'جدول أسبوعي منتظم', checkConsistentScheduleDetail: 'متوسط إتمام الروتين {pct}%',
    checkMultiDayUse: 'استخدام متعدد الأيام أسبوعياً', checkMultiDayUseDetail: 'نشط {n}/٧ أيام',
    checkCumulativeVocab: 'حجم المفردات التراكمي', checkCumulativeVocabDetail: '{n}/250 هدف نقرات الكلمات التراكمي',
    tipNoWordsThisWeek: 'لم تُستخدم أي كلمات هذا الأسبوع — راجع اللوحة.', tipProgressOnTrack: 'التقدم يسير ضمن النطاق المتوقع.',
    wordSequenceLabel: '   (تسلسل الكلمات)',
    moreTitle: 'المزيد', adminControlCenterTitle: 'مركز تحكم المشرف', adminControlCenterSub: 'لوحات التواصل، ملفات الأطفال، مفاتيح الذكاء الاصطناعي والتحليلات', adminBadgeShort: 'مشرف',
    rowVoiceCommandMatch: 'مطابقة الأوامر الصوتية', rowCategoryBuilder: 'إنشاء الفئات', rowMyCategories: 'فئاتي', rowPhraseLibrary: 'مكتبة العبارات',
    rowContentReviewQueue: 'قائمة مراجعة المحتوى', rowSentencePicture: 'صورة الجملة', rowMilestones: 'الإنجازات', rowCalmDown: 'الهدوء',
    rowDoctorPanel: 'لوحة الطبيب', rowAllChildren: 'كل الأطفال', rowSettingsLanguage: 'الإعدادات واللغة', switchChildLabel: 'تبديل الطفل ({name})',
    patientsListBack: 'قائمة المرضى', doctorPanelSub: 'التقييم السريري، وصف العلاج، ومقاييس المريض',
    patientHeaderLine: 'المريض: {name} ({age} سنوات)', exportReportBtn: 'تصدير التقرير',
    enrolledPatientsCount: 'المرضى المسجلون ({n})', selectPatientHint: 'اختر مريضاً لفحص السجلات السريرية ووصف العلاج',
    noChildrenEnrolled: 'لا يوجد أطفال مسجلون بعد.',
    ageYrsBadge: '{age} سنوات', weeklyWordsLabel: 'الكلمات الأسبوعية', therapyGoalsLabel: 'أهداف العلاج',
    tabAZPerformance: 'الأداء الشامل', tabTherapyGoalsShort: 'أهداف العلاج', tabClinicalNotes: 'الملاحظات السريرية', tabDoctorContact: 'التواصل مع الطبيب', tabContent: 'المحتوى',
    metricTotalWordTaps: 'إجمالي نقرات الكلمات', metricVocabDiversity: 'تنوع المفردات', metricSentencesSpoken: 'الجمل المنطوقة', metricRoutineAdherence: 'الالتزام بالروتين',
    speechSentenceFormationTitle: 'الكلام وتكوين الجمل', longestVerbalCompositionSub: 'أطول تركيب لفظي كوّنه {name}:', wordsConstructedPrefix: 'تم تكوين {n} كلمة:', noFullSentenceLogged: 'لم يتم تسجيل أي جملة كاملة بعد.',
    sevenDayVolumeTitle: 'حجم التواصل خلال 7 أيام', topCommunicatedVocabTitle: 'أكثر المفردات استخداماً', tapsUnit: 'نقرة', noVocabTapsYet: 'لا توجد نقرات مفردات مسجلة بعد.',
    iMadeMistake: 'أخطأت', undoOrClearMsg: 'تراجع عن آخر كلمة أم مسح الكل؟', closeBtn: 'إغلاق', undoLastWordBtn: 'تراجع عن آخر كلمة', clearAllBtn: 'مسح الكل', oopsBtn: 'عفواً',
    registeredChildProfilesCount: '{n} ملف طفل مسجل · {stars} ⭐ مكتسبة', addBtnShort: 'إضافة',
    childrenCareDirectoryTitle: 'دليل رعاية الأطفال', childrenCareDirectoryDesc: 'اختر ملف طفل لتفعيل لوحة التواصل الخاصة به، تعديل أهداف العلاج، أو مراجعة بطاقات الطوارئ.',
    enrollFirstChildHint: 'اضغط الزر أدناه لتسجيل طفلك الأول باستخدام التعرف على الوجه أو صورة.',
    removeChildTitle: 'إزالة {name}؟', removeChildMsg: 'سيؤدي هذا إلى حذف ملفه وسجلات التواصل.', removeBtnShort: 'إزالة',
    ageLabelShort: 'العمر {age}', enrolledSincePrefix: 'مسجَّل منذ {date} · {stars} ⭐ مكتسبة',
    metricWordsPerWeek: 'كلمات/أسبوع', metricStreak: 'التتابع', metricRoutineShort: 'الروتين', metricFaceScan: 'التعرف على الوجه',
    faceScanActive: 'مفعّل', faceScanOff: 'متوقف',
    launchBoardBtn: 'تشغيل اللوحة', passcardBtnLabel: 'بطاقة الطوارئ',
    quickAccess: 'وصول سريع', todaySchedule: 'جدول اليوم', communicateNow: 'تواصل الآن', todaysSchedule: 'جدول اليوم',
    playAGame: 'العب لعبة', parentDashboard: 'التقدم', levelDeveloping: 'المستوى: في تطور', nextUp: 'التالي',
    starsLabel: 'نجوم', dayStreak: 'أيام متتالية', todayLabel: 'اليوم', moreStarsToLevel: 'نجوم للترقية',
    qCommunicate: 'تواصل', qPictureTalk: 'الحديث بالصور', qActivities: 'أنشطة',
    happeningNow: 'يحدث الآن', nextLabel: 'التالي', nowBadge: 'الآن',
    sBreakfast: 'الفطور', sPlayTime: 'وقت اللعب', sAacSession: 'جلسة تواصل', sLunch: 'الغداء',
    sRestTime: 'وقت الراحة', sSkillActivity: 'نشاط مهارة',
    stDone: 'تم', stNow: 'الآن', stUpcoming: 'قادم', tasksLabel: 'مهام', doneSpoken: 'تم!',
    pOverview: 'نظرة عامة', pVocabulary: 'المفردات', pSchedule: 'الجدول', pPrivacy: 'الخصوصية',
    pWordsWeek: 'كلمات هذا الأسبوع', pAdherence: 'الالتزام بالجدول', pGameStreak: 'تتابع الألعاب (أيام)',
    pMilestones: 'الإنجازات', pRecommendations: 'توصيات',
    pTotalWords: 'إجمالي الكلمات المنطوقة', pDiffWords: 'كلمات مختلفة', pMostActive: 'أكثر يوم نشاطاً', pWeekSummary: 'ملخص الأسبوع',
    pM1: 'أول كلمات منطوقة', pM2: 'استخدام ١٠ كلمات مختلفة', pM3: 'التزام بالجدول ٨٠٪+', pM4: 'تتابع ألعاب ٣ أيام', pM5: 'كسب ٢٥ نجمة',
    pDaysActive: 'أيام نشطة', pActive: 'نشط',
    pDailyUsage: 'استخدام التواصل اليومي (كلمات)', pMostUsed: 'أكثر الكلمات استخداماً', pWeeklyAdherence: 'الالتزام الأسبوعي',
    pExportIep: 'تصدير تقرير الخطة', pDataOnDevice: 'البيانات مخزنة على هذا الجهاز',
    pMathOnly: '✓ بيانات رياضية فقط — بلا صور', pOnDeviceOnly: '✓ على الجهاز فقط — لا تُرسل أبداً',
    pFaceRecognition: 'التعرف على الوجه', pGeneralConsent: 'الموافقة العامة',
    pConsented: 'موافَق عليه', pNotEnabled: 'غير مفعّل', pNotGiven: 'غير ممنوح', pDeleteFace: 'حذف بيانات الوجه',
    pNoWordsYet: 'لا كلمات منطوقة بعد — سيظهر الاستخدام هنا عند استخدام لوحة التحدث.',
    pTip1: 'جرّب جلسة تواصل قصيرة كل يوم لبناء المفردات.',
    pTip2: 'الالتزام بالجدول منخفض — راجعوا الجدول المرئي معاً كل صباح.',
    pTip3: 'أدخل ٢-٣ كلمات جديدة هذا الأسبوع (كلمات المشاعر أو الأسئلة مفيدة).',
    pTip4: 'لعبة يومية سريعة تبقي التعلم منتظماً وتبني تتابعاً.',
    pTip0: 'ثبات رائع هذا الأسبوع — واصلوا الروتين الحالي.',
    pTimes: 'مرات',
    setSpeech: 'النطق', setSpeakingSpeed: 'سرعة النطق', setSlow: 'بطيء', setNormal: 'عادي', setFast: 'سريع',
    setBoard: 'اللوحة', setHaptics: 'اهتزاز اللمس', setTilesPerRow: 'بطاقات في الصف',
    setAccessibility: 'إمكانية الوصول', setKiosk: 'وضع الكشك', setLockOpen: 'قفل التطبيق مفتوحاً',
    setKioskInfo: 'عند التفعيل، يُحظر زر الرجوع في أندرويد وتبقى الشاشة مضاءة. لمنع خروج الطفل تماماً، فعّل أيضاً تثبيت الشاشة (أندرويد) أو الوصول الموجّه (آيفون). الخروج من وضع الكشك داخل التطبيق يطلب رمز المرور.',
    setParentControls: 'ضوابط الوالدين', setChangePasscode: 'تغيير رمز المشرف', setSetPasscode: 'تعيين رمز المشرف',
    setState: 'مُعيّن', setNotSet: 'غير مُعيّن', setPixabay: 'مفتاح صور Pixabay (اختياري)',
    setBackup: 'النسخ الاحتياطي', setExport: 'تصدير', setRestore: 'استعادة',
    pLegendExcellent: '≥ ٨٠٪ ممتاز', pLegendGood: '٦٠–٨٠٪ جيد', pLegendNeeds: '< ٦٠٪ يحتاج انتباهاً',
    pSummaryNone: 'لم يستخدم لوحة التحدث هذا الأسبوع بعد. شجّعوا على بضع جلسات تواصل لبناء رؤى المفردات.',
    pSummaryUsing: 'يستخدم لوحة التواصل بانتظام', pSummaryOften: 'غالباً بكلمة', pSummaryAnd: 'و',
    pRoutinesStrong: 'الروتين اليومي قوي.', pRoutinesTrack: 'الروتين اليومي على المسار.', pRoutinesMore: 'الروتين اليومي يحتاج ثباتاً أكثر.',
    pSummaryTail: 'فكّروا في تشجيع المزيد من كلمات الأسئلة.',
    moodQuestion: 'كيف تشعر اليوم؟', quickExpressHeading: 'تواصل سريع',
    feelingTag: 'أشعر بـ', sayIAmFeeling: 'أشعر اليوم بأنني', bathroom: 'الحمام',
    needHelpPhrase: 'أحتاج مساعدة من فضلك!', needWaterPhrase: 'أريد الماء من فضلك.',
    needBathroomPhrase: 'أحتاج إلى استخدام الحمام.', pleaseStopPhrase: 'توقف من فضلك.',
    completedToday: '✓ أُنجز اليوم!', startExercise: 'ابدأ التمرين ←',
    therapyTargetBadge: 'هدف العلاج من الطبيب', tapToPracticeNow: 'اضغط للتدرب الآن',
    doctorsPlan: 'خطة الطبيب', unitWords: 'كلمات', viewFullSchedule: 'عرض الجدول الكامل',
    defaultSpeechGoalTitle: 'تحدث بـ ٣ كلمات مع لوحة التواصل', doctorsDailyGoal: 'الهدف اليومي من الطبيب',
    visualRoutineSubtitle: 'دليل الروتين المرئي والخطوات المتتابعة', readAloudBtn: 'استمع',
    activitiesCompletedSuffix: 'نشاط مكتمل',
    statusCompleted: 'مكتمل ✓', statusHappeningNow: 'جارٍ الآن', statusUpcoming: 'قادم',
    addCustomRoutineTask: '+ إضافة نشاط روتيني', addCustomRoutineActivity: 'إضافة نشاط روتيني مخصص',
    activityNameLabel: 'اسم النشاط', activityNamePlaceholder: 'مثال: جلسة تواصل، تنظيف الأسنان، الملعب…',
    scheduledTimeLabel: 'الوقت المحدد', scheduledTimePlaceholder: 'مثال: ١١:٣٠',
    activityIconLabel: 'رمز النشاط', addToScheduleBtn: 'أضف إلى الجدول',
    firstThenBoardTitle: 'لوحة أولاً - ثم',
    firstThenSubtitle: 'هيكل مرئي واضح يساعد طفلك على الانتقال بين الأنشطة.',
    firstLabel: '١. أولاً', thenLabel: '٢. ثم', activityFallback: 'نشاط', rewardPlayFallback: 'مكافأة / لعب',
    markFirstDoneBtn: 'أنهِ النشاط الأول!',
    requiredAlertTitle: 'مطلوب', requiredAlertMsg: 'الرجاء إدخال اسم النشاط.',
    rightNowTimeFor: 'الآن، حان وقت:', allTasksFinished: 'انتهت جميع المهام لهذا اليوم! عمل رائع!',
    finishedGreatJob: '. انتهى! عمل رائع!',
    namePlaceholder: 'مثال: علي، سارة، أحمد', agePlaceholder: 'مثال: ٥', selectAllThatApply: '(اختر كل ما ينطبق)',
    faceCaptureFailed: 'تعذر التقاط وجهك. حاول مرة أخرى.',
    capturingEllipsis: 'جارٍ الالتقاط…', captureBtn: 'التقاط', finishBtn: 'إنهاء!',
    hasBeenAdded: 'تمت إضافته!', faceUnlockHint: 'يمكنه الآن فتح التطبيق بالتعرف على الوجه.',
    startWithChild: 'ابدأ مع', doneCheck: '✓ تم', addAnotherChild: 'إضافة طفل آخر',
    positionFaceHint: 'ضع وجهك داخل الدائرة', holdSteadyHint: 'ابقَ ثابتاً، نبحث عنك… 😊',
    noChildEnrolled: 'لم يتم تسجيل أي طفل بعد.', checkingFaceEllipsis: 'جارٍ التحقق من الوجه…',
    adjustingLighting: 'جارٍ ضبط الإضاءة (المحاولة {n}/٣)…',
    didntCatchFace: 'لم يتم التعرف على الوجه', cameraNotAvailable: 'الكاميرا غير متاحة',
    scanningFaceEllipsis: 'جارٍ فحص الوجه…', lookedEverywhere: 'بحثنا في كل مكان!', cameraUnavailableMsg: 'الكاميرا غير متاحة',
    scanAgainBtn: 'إعادة المسح', selectChildBtn: 'اختر الطفل', continueWithoutCamera: 'المتابعة بدون كاميرا',
    selectChildProfileBtn: '👦 اختر ملف الطفل', adminPortalBtn: '🛠️ بوابة الإدارة',
    chooseChildProfileTitle: 'اختر ملف الطفل', tapChildProfileHint: 'اضغط على ملف طفلك لفتح جلسته:',
    ageLabel: 'العمر', welcomeBack: 'مرحباً بعودتك، {name}! 🎉',
    cbHeaderTitle: 'إنشاء الفئات', cbReviewTitle: 'مراجعة وحفظ',
    cbHeaderSubInput: 'أنشئ فئة كاملة دفعة واحدة', cbHeaderSubReview: '{name} · {count} كلمة',
    cbCommandLabel: 'أمر', cbCommandPlaceholder: 'مثال: "أنشئ فئة حيوانات تحتوي على ٤٠ حيواناً"',
    cbListLabel: 'أو الصق قائمة كلمات (اختياري)', cbListPlaceholder: 'قطة\nكلب\nأرنب\nحصان ...',
    cbQuickStart: 'بداية سريعة', cbGenerateBtn: 'أنشئ الفئة',
    cbHint: 'تستخدم الصور أيقونات مدمجة وتعمل بدون إنترنت بالكامل. تعمل الصور الحقيقية تلقائياً عند تفعيل مزود صور.',
    cbCategoryNameLabel: 'اسم الفئة', cbGeneratingImages: 'جارٍ إنشاء الصور…',
    cbApproveSaveBtn: 'اعتماد وحفظ {count} كلمة', cbEditWordTitle: 'تعديل الكلمة',
    cbLabelField: 'التسمية', cbSpokenPhraseField: 'العبارة المنطوقة',
    cbNothingToAddTitle: 'لا يوجد شيء لإضافته', cbTryBuiltIn: 'جرّب فئة جاهزة أو الصق قائمة كلمات.',
    cbHeadsUpTitle: 'تنبيه', cbAddWordFirst: 'أضف كلمة واحدة على الأقل أولاً.',
    cbCategoryCreatedSpeech: 'تم إنشاء فئة {name} بـ {count} كلمة',
    rFirstStar: 'أول نجمة!', rFiveStars: 'جامع النجوم', rTenStars: 'بطل النجوم',
    rTwentyStars: 'نجم خارق!', rFiftyStars: 'أسطورة!', rExplorer: 'مستكشف',
    rReader: 'دودة الكتب', rHelper: 'صديق مساعد', rChildAchievements: 'إنجازات {name}',
    rPlusOneStar: '+١ نجمة', rBadgesEarnedSuffix: 'مكتسبة', rComingSoon: 'قريباً',
    rMoreStars: '+{n} أخرى', rNeededSuffix: 'مطلوبة',
    cdAgain: '🔄 مرة أخرى', cdBegin: '▶ ابدأ', cdStop: '■ توقف',
    cdTip: '💡 شهيق من الأنف… انتظر قليلاً… ثم زفير ببطء من الفم',
    avThinkingCreatePic: 'جارٍ إنشاء صورة…', avCouldNotCreatePic: 'تعذر إنشاء صورة.',
    avThinkingSavePic: 'جارٍ حفظ الصورة…', avCouldNotSavePic: 'تعذر حفظ هذه الصورة.',
    avThinkingListening: 'أستمع…', avMicPermission: 'يلزم إذن الميكروفون لنطق كلمة.',
    avThinkingFindPics: 'جارٍ البحث عن صور…', avCouldNotDownloadPic: 'تعذر تنزيل هذه الصورة. جرّب أخرى.',
    avCameraPermission: 'يلزم إذن الكاميرا.', avThinkingSavePhoto: 'جارٍ حفظ الصورة…',
    avGalleryPermission: 'يلزم إذن مكتبة الصور.', avTypeWordFirst: 'اكتب كلمة أولاً.',
    avAiHint: 'الصور المصنوعة بالذكاء الاصطناعي تستخدم OpenAI. أضف مفتاحاً في الإعدادات — الزر جاهز لذلك.',
    avFolderNamePlaceholder: 'اسم المجلد', avDefaultCategoryName: 'فئة جديدة',
    pmTitle: 'مكتبة العبارات', pmTotal: 'الإجمالي', pmMatched: 'متطابقة', pmCategories: 'الفئات',
    pmSearchPlaceholder: 'ابحث عن عبارات أو تسميات…', pmAllCategories: 'كل الفئات',
    pmAllLevels: 'كل المستويات', pmLevelN: 'المستوى {n}', pmNoMatch: 'لا توجد عبارات مطابقة للمرشحات الحالية.',
    pmNoMatchHint: 'اضغط على "+" لإضافة عبارة جديدة، أو عدّل المرشحات أعلاه.',
    pmCardSub: '{category} · {count} عبارات محفزة', pmGalleryPermission: 'يلزم إذن الوصول إلى الصور لاختيار الصور.',
    pmCameraPermission: 'يلزم إذن الكاميرا لالتقاط صورة.', pmLabelRequired: 'التسمية مطلوبة.',
    pmUncategorized: 'غير مصنف', pmRemovePhraseTitle: 'إزالة العبارة؟',
    pmRemovePhraseMsg: 'سيتم إزالة "{label}" من المكتبة.', pmRemove: 'إزالة',
    pmEditPhrase: 'تعديل العبارة', pmAddNewPhrase: 'إضافة عبارة جديدة', pmTakePhoto: '📷 التقط صورة',
    pmGallery: '🖼️ المعرض', pmLabelField: 'التسمية', pmLabelPlaceholder: 'ما الذي يُنطق / يُعرض',
    pmTriggerPhrasesLabel: 'العبارات المحفزة (مفصولة بفواصل)',
    pmTriggerPhrasesPlaceholder: 'مثال: "الكتاب على الطاولة، فوق الطاولة، الكتاب فوق الطاولة"',
    pmCategoryLabel: 'الفئة', pmCategoryPlaceholder: 'حروف الجر، الطعام…', pmLevelLabel: 'المستوى ١–٥',
    pmSourceBookLabel: 'كتاب المصدر (اختياري)', pmSourceBookPlaceholder: 'لأغراض التوثيق والإسناد',
    pmLicenseLabel: 'مرجع الترخيص (اختياري)', pmLicensePlaceholder: 'CC BY 4.0، إلخ.',
    pmImagePreview: 'معاينة الصورة',
    crqTitle: 'مراجعة المحتوى', crqPending: 'قيد الانتظار', crqApproved: 'مقبول', crqRejected: 'مرفوض', crqAll: 'الكل',
    crqInfoText: 'يظهر هنا المحتوى المستخرج تلقائياً من مصادر مرخّصة (مثل GDL أو CC-BY). الموافقة تنشره في مكتبة العبارات. الرفض يتجاهله.',
    crqNothingToShow: 'لا يوجد شيء لعرضه.', crqEmptyPending: 'قائمة المراجعة فارغة.',
    crqEmptyOther: 'غيّر مرشح الحالة أعلاه لرؤية عناصر أخرى.',
    crqSourceLicense: 'المصدر: {source} · الترخيص: {license}', crqCategoryLevel: 'الفئة: {category} · المستوى {level}',
    crqApprove: 'قبول', crqEdit: 'تعديل', crqReject: 'رفض', crqClear: 'مسح',
    crqAlreadyReviewedTitle: 'تمت مراجعته مسبقاً', crqAlreadyReviewedMsg: 'تمت معالجة هذا العنصر بالفعل.',
    crqApprovePublishTitle: 'الموافقة والنشر؟', crqApprovePublishMsg: 'سيتم نشر "{label}" في مكتبة العبارات الخاصة بالطفل.',
    crqRejectTitle: 'رفض هذا العنصر؟', crqRejectMsg: 'المصدر: {source}',
    crqDeleteRecordTitle: 'حذف السجل؟', crqDeleteRecordMsg: 'سيتم حذف عنصر القائمة هذا نهائياً؛ العناصر المنشورة مسبقاً في مكتبة العبارات لن تتأثر.',
    crqDelete: 'حذف', crqGalleryPermission: 'يلزم إذن الوصول إلى الصور.', crqCameraPermission: 'يلزم إذن الكاميرا.',
    crqEditTitle: 'تعديل قبل المراجعة', crqImagePickHint: 'اضغط لاختيار صورة، أو استخدم الأزرار أدناه',
    crqCameraBtn: '📷 الكاميرا', crqGalleryBtn: '🖼️ المعرض', crqDetectedPhrase: 'العبارة المكتشفة',
    crqDetectedPhrasePlaceholder: 'العبارة كما اكتُشفت', crqAltVariations: 'صيغ بديلة (مفصولة بفواصل)',
    crqAltVariationsPlaceholder: 'صياغات بديلة اختيارية', crqSuggestedLabel: 'التسمية المقترحة (تُنطق عند التطابق)',
    crqSuggestedLabelPlaceholder: 'التسمية الظاهرة للطفل', crqCategoryLabel: 'الفئة', crqCategoryPlaceholder: 'حروف الجر، التحيات…',
    crqLevelLabel: 'المستوى ١–٥', crqSourceLabel: 'المصدر / التوثيق', crqSourcePlaceholder: 'الكتاب / الصفحة / سياق الاستخراج',
    crqLicenseLabel: 'الترخيص (الإسناد)', crqLicensePlaceholder: 'CC BY 4.0، إلخ.',
    crqReviewerNote: 'ملاحظة المراجع (اختياري)', crqReviewerNotePlaceholder: 'ملاحظات داخلية (لا تظهر للطفل)',
    vcmTitle: 'مطابقة الصوت', vcmBreadcrumb: 'انطق عبارة — ستظهر الصورة المطابقة.',
    vcmTapMic: 'اضغط على الميكروفون للتحدث', vcmTrySaying: 'جرّب أن تقول: "الكتاب على الطاولة"، "تحت الطاولة"، "قريب".',
    vcmListening: 'يستمع…', vcmListeningPlaceholder: 'يستمع… 🎙️', vcmCancel: 'إلغاء',
    vcmMatchingVoice: 'جارٍ مطابقة الصوت…', vcmHeardPrefix: 'سُمع: "{text}"',
    vcmCategoryLabel: 'الفئة', vcmLevelLabel: 'المستوى', vcmPlayAgain: 'تشغيل التسمية مرة أخرى',
    vcmNoMatchTitle: 'لا أعرف هذه العبارة بعد.', vcmNoMatchSub: 'جرّب قول شيء مثل "على الطاولة" أو اضغط على مثال أدناه.',
    vcmErrorTitle: 'تعذّرت معالجة الكلام', vcmErrorDefault: 'يرجى المحاولة مرة أخرى.',
    vcmPracticeTitle: 'عبارات للتدريب (اضغط للتجربة):', vcmStartSpeaking: '🎙️ ابدأ التحدث',
    vcmMatching: 'جارٍ المطابقة…', vcmTryAnother: '🎙️ جرّب مرة أخرى', vcmDoneSpeaking: 'انتهيت من التحدث (مطابقة)',
    vcmClearResult: 'مسح النتيجة', vcmVoiceUnavailable: 'تسجيل الصوت غير متاح. يرجى منح إذن الميكروفون.',
    vcmMicStartFail: 'تعذر تشغيل الميكروفون. تحقق من إذن الميكروفون.',
    vcmSampleOnTable: 'على الطاولة', vcmSampleUnderTable: 'تحت الطاولة', vcmSampleInSomething: 'داخل شيء ما',
    vcmSampleAboveTable: 'فوق الطاولة', vcmSampleNearTable: 'قرب الطاولة',
    mcWordsCount: '{count} كلمة', mcAddWord: 'إضافة كلمة', mcSortAZ: 'ترتيب أبجدي', mcGroups: 'مجموعات',
    mcRecordedVoice: '🎙️ صوت مسجَّل', mcTextToSpeech: '🔊 تحويل النص إلى كلام',
    mcMoveHint: 'اضغط على كلمة لتعديل صورتها وصوتها. استخدم الأسهم لإعادة الترتيب.',
    mcFolderTitle: 'مجلد', mcFolderNamePlaceholder: 'اسم المجلد',
    mcDeleteFolderTitle: 'حذف "{name}"؟', mcDeleteFolderMsg: 'سيتم حذف {count} كلمة (وأي مجلدات فرعية).',
    mcDelete: 'حذف', mcNothingToExport: 'لا يوجد شيء للتصدير بعد.', mcBackupShareTitle: 'نسخة احتياطية لفئات Angel Talk',
    mcInvalidBackupJson: 'هذا لا يبدو ملف JSON نسخة احتياطية صالحاً.', mcRestoreCompleteTitle: 'اكتملت الاستعادة',
    mcRestoredWithWarningsTitle: 'تمت الاستعادة مع تحذيرات', mcRestoreSummary: '{cats} فئة · {words} كلمة · {images} صورة',
    mcMyCategoriesTitle: 'فئاتي', mcCaregiverMade: '{count} من إنشاء مقدم الرعاية', mcAddWordByVoice: 'إضافة كلمة بالصوت',
    mcDefaultFolderName: 'مجلد جديد', mcNewFolder: 'مجلد جديد', mcBulkBuild: 'إنشاء مجموعة',
    mcExportBackup: 'تصدير / نسخ احتياطي', mcImport: 'استيراد',
    mcEmptyFolders: 'لا توجد مجلدات بعد. اضغط "مجلد جديد" للبدء، أو "إنشاء مجموعة" لتوليد واحد.',
    mcHiddenFromChild: ' · مخفي عن الطفل', mcPasteBackupTitle: 'الصق ملف JSON للنسخة الاحتياطية', mcRestore: 'استعادة',
    mcAddSubCategory: 'إضافة فئة فرعية', mcSubCategories: 'الفئات الفرعية',
    mcAddSubCategoryTitle: 'إضافة إلى {name}', mcSubCategoryPlaceholder: 'مثال: نهاية الأسبوع',
    mcFindWord: 'ابحث عن كلمة', mcColWord: 'الكلمة', mcColUseCount: 'عدد الاستخدام', mcColLastUsed: 'آخر استخدام',
    mcTimesCount: '{count} مرة', mcNotYet: 'لم يُستخدم بعد', mcNoWordsMatch: 'لا توجد كلمات مطابقة لبحثك.',
    admLoading: 'جارٍ تحميل مركز تحكم المشرف…', admTabBoards: 'لوحات AAC', admTabChildren: 'الأطفال',
    admTabContent: 'المحتوى', admTabSettings: 'النظام والذكاء الاصطناعي', admTabAnalytics: 'التحليلات',
    admHeaderTitle: 'مركز تحكم المشرف', admSuperAdmin: 'مشرف عام',
    admHeaderSubtitle: 'إدارة لوحات AAC والأطفال ومفاتيح الذكاء الاصطناعي والسجلات السريرية',
    admCategoriesTitle: 'الفئات واللوحات', admCategoriesSubtitle: '{count} فئة · اضغط على أي منها لعرض/تعديل البطاقات',
    admAddCategory: 'إضافة فئة', admTotalTiles: '{count} بطاقة مفردات إجمالاً', admAddCardBtn: '+ بطاقة',
    admSearchCardsPlaceholder: 'ابحث عن بطاقات في هذه الفئة…', admNoCardsFound: 'لا توجد بطاقات في هذه الفئة.',
    admAddFirstCard: '+ إضافة أول بطاقة',
    admSyncTitle: 'مزامنة لغة اللوحة تلقائياً', admSyncDesc: 'ترجمة جميع بطاقات المدرسة والجُمل الافتراضية إلى اللغة الحالية ({lang}).',
    admSyncNow: 'مزامنة الآن',
    admRequired: 'مطلوب', admEnterCategoryName: 'يرجى إدخال اسم الفئة.', admSuccess: 'تم بنجاح',
    admCategoryCreated: 'تم إنشاء فئة "{name}".',
    admDeleteCategoryTitle: 'حذف الفئة؟', admDeleteCategoryMsg: 'هل أنت متأكد من حذف "{name}" وبطاقاتها البالغ عددها {count}؟',
    admDelete: 'حذف',
    admDeleteCardTitle: 'حذف البطاقة؟', admDeleteCardMsg: 'حذف "{label}" من هذه الفئة؟',
    admChildrenTitle: 'سجلات الأطفال والمرضى', admChildrenSubtitle: '{count} ملف مسجل بإعدادات ذكاء اصطناعي تكيفية',
    admEnrollChild: 'تسجيل طفل', admAgeEnrolled: 'العمر: {age} سنة · تاريخ التسجيل: {date}', admNoDiagnoses: 'لم يتم تحديد أي تشخيصات',
    admSetActive: 'تفعيل', admEditRecord: 'تعديل السجل', admNoChildren: 'لا يوجد أطفال مسجلون بعد.',
    admEnrollFirstChild: '+ تسجيل أول طفل',
    admInvalidInput: 'إدخال غير صالح', admInvalidNameAge: 'يرجى إدخال اسم وعمر صحيحين.',
    admSaved: 'تم الحفظ', admProfileUpdated: 'تم تحديث ملف {name}.',
    admDeleteChildTitle: 'حذف {name}؟', admDeleteChildMsg: 'سيؤدي هذا إلى إزالة الملف وسجلات الوجه. لا يمكن التراجع عن هذا.',
    admDeleteProfile: 'حذف الملف',
    admContentTitle: 'خط أنابيب المحتوى والرسوم', admContentSubtitle: 'ARASAAC وOpenSymbols ومكتبة رسوم حسية نظيفة',
    admReviewQueue: 'قائمة المراجعة',
    admArasaacTitle: 'ARASAAC الرسمي', admArasaacDesc: 'رموز موثقة من البوابة الأراغونية للتواصل المعزز والبديل.',
    admIntegratedCached: 'مدمج ومخزّن مؤقتاً',
    admOpenSymbolsTitle: 'OpenSymbols / Mulberry', admOpenSymbolsDesc: 'أكثر من 59,000 رمز تواصل سريري مرخّص مفتوح للأطفال.',
    admReadyOnDemand: 'جاهز عند الطلب',
    admCacheTitle: 'صيانة الذاكرة المؤقتة المحلية', admCacheDesc: 'يمسح ذاكرة الصور المحملة وذاكرة الصور المؤقتة دون حذف بطاقات الكلمات.',
    admClearCache: 'مسح الذاكرة المؤقتة', admCacheCleaned: 'تم تنظيف الذاكرة المؤقتة', admCacheCleanedMsg: 'تم مسح ذاكرة الصور المؤقتة.',
    admSettingsTitle: 'النظام ومحركات الذكاء الاصطناعي', admSettingsSubtitle: 'بيانات اعتماد API، تركيب الكلام، اللغة وقفل الأمان',
    admApiKeysTitle: 'مفاتيح API للذكاء الاصطناعي والبحث السحابي', admOpenAiKeyLabel: 'مفتاح OpenAI API (DALL-E وWhisper STT)',
    admAiConfigured: '✓ محرك الذكاء الاصطناعي النشط مُهيّأ.', admAiOptional: 'اختياري: العرض التجريبي بدون اتصال يعمل بدون مفتاح.',
    admPixabayKeyLabel: 'مفتاح Pixabay API للبحث', admPixabayPlaceholder: 'مفتاح Pixabay API…',
    admSpeechEngineTitle: 'محرك الكلام والصوت', admVoiceTest: 'اختبار الصوت ({lang})', admSpeechRateLabel: 'سرعة الكلام: {rate}x',
    admPlaying: 'قيد التشغيل…', admTestVoice: 'اختبار الصوت',
    admSpeechPreset: 'إعداد سرعة الكلام', admPresetSlow: 'بطيء (0.65x)', admPresetNormal: 'عادي (0.9x)', admPresetFast: 'سريع (1.0x)',
    admSoundFx: 'المؤثرات الصوتية', admHaptics: 'الاهتزاز اللمسي', admLanguageTitle: 'لغة الواجهة النشطة',
    admSecurityTitle: 'أمان المشرف وقفل الكشك', admSetPin: 'تعيين رمز مرور المشرف من 4 أرقام', admPinPlaceholder: 'مثال: 1234',
    admUpdatePin: 'تحديث الرمز', admKioskLock: 'قفل لوحة الكشك',
    admKioskDesc: 'يمنع الخروج من شاشة AAC دون رمز الزاوية بالنقر 5 مرات.',
    admBackupTitle: 'النسخ الاحتياطي ونقل البيانات',
    admBackupDesc: 'تصدير أو استعادة جميع الفئات والكلمات وتعديلات اللوحة المخصصة بصيغة JSON.',
    admExportJson: 'تصدير JSON', admImportJson: 'استيراد JSON',
    admOpenAiKeySaved: 'تم حفظ مفتاح OpenAI API بنجاح.', admPixabayKeySaved: 'تم حفظ مفتاح Pixabay API بنجاح.',
    admInvalidPin: 'رمز غير صالح', admPinDigitsMsg: 'يجب أن يتكون الرمز من 4 أرقام بالضبط.',
    admPinSavedTitle: 'تم حفظ رمز الأمان', admPinSavedMsg: 'تم تحديث رمز مرور المشرف بنجاح.',
    admPasteBackupJson: 'يرجى لصق ملف JSON الاحتياطي.', admRestoredMsg: 'تمت استعادة {cats} فئة و{words} كلمة.',
    admError: 'خطأ', admBackupInvalidStruct: 'تعذر التحقق من بنية ملف JSON الاحتياطي.',
    admInvalidJsonTitle: 'JSON غير صالح', admInvalidJsonMsg: 'النص المُدخل ليس JSON صالحاً.',
    admSyncBoardLangTitle: 'مزامنة لغات اللوحة', admSyncBoardLangMsg: 'ترجمة البطاقات الافتراضية إلى لغة التطبيق الحالية ({lang})؟',
    admTranslate: 'ترجمة', admCompleted: 'اكتمل', admSeedTranslated: 'تمت ترجمة اللوحة الافتراضية.',
    admAnalyticsTitle: 'استخدام وتحليلات سريرية', admAnalyticsSubtitle: 'مقاييس تواصل فورية عبر جميع الأطفال المسجلين',
    admReport: 'تقرير', admExportCsv: 'تصدير CSV',
    admReportTemplate: 'تقرير تحليلات Angel Talk السريري\nتاريخ الإنشاء: {date}\nالأطفال: {children}\nنقرات الكلمات الأسبوعية: {taps}\nالجُمل المُكوَّنة: {sentences}\nالالتزام بالروتين: {routine}%\nأهم الكلمات: {topWords}',
    admEnrolledPatients: 'المرضى المسجلون', admWeeklyWordTaps: 'نقرات الكلمات الأسبوعية', admSentencesSpoken: 'الجُمل المنطوقة',
    admAvgAdherence: 'متوسط الالتزام بالجدول',
    admTopVocab: 'أهم كلمات المفردات', admTapsSuffix: '{count} نقرة',
    admNoWordEvents: 'لا توجد أحداث نقر كلمات مسجلة بعد. اضغط على البطاقات في لوحة AAC لملء المقاييس.',
    admNewCategoryTitle: 'إنشاء فئة AAC جديدة', admNewCategorySubtitle: 'أضف تبويب تواصل جديد لمريضك أو فصلك الدراسي',
    admCategoryNameLabel: 'اسم الفئة', admCategoryNamePlaceholder: 'مثال: ملعب، وقت الوجبة…',
    admCategoryIconLabel: 'رمز أيقونة الفئة', admCreateCategory: 'إنشاء الفئة',
    admEditChildTitle: 'تعديل سجل الطفل', admEditChildSubtitle: 'تحديث معايير التشخيص والأهداف المستهدفة',
    admChildNameLabel: 'اسم الطفل', admAgeYearsLabel: 'العمر (سنوات)',
    admDensityLabel: 'كثافة شبكة الأزرار (سُلّم تصاعدي تدريجي)',
    admDensityBeginner: '1 (مبتدئ)', admDensityDense: '+35 (كثيف)',
    admPageStyleLabel: 'أسلوب تنظيم مجموعة الصفحات', admCategoryFolders: 'مجلدات الفئات',
    admCategoryFoldersSub: 'تسلسل هرمي على طراز Avaz / TouchChat', admFixedCoreGrid: 'شبكة أساسية ثابتة',
    admFixedCoreGridSub: 'ذاكرة حركية على طراز LAMP / Proloquo',
    admDiagnosesTagsLabel: 'وسوم التشخيص', admSaveChanges: 'حفظ التغييرات',
    admBackupModalTitle: 'نسخ احتياطي واستعادة JSON', admBackupModalSubtitle: 'الصق نص JSON الاحتياطي أدناه لاستعادة حالة النظام:',
    admPasteJsonPlaceholder: 'الصق نص JSON الاحتياطي هنا...', admCloseBtn: 'إغلاق', admRestoreData: 'استعادة البيانات',
    docRequiredGoalMsg: 'يرجى إدخال عنوان هدف صالح وعدد مستهدف.', docGoalSuccessMsg: 'تم وصف الهدف العلاجي وتعيينه للطفل.',
    docDeleteGoalTitle: 'حذف الهدف؟', docDeleteGoalMsg: 'إزالة هذا الهدف العلاجي؟', docDelete: 'حذف', docCancel: 'إلغاء',
    docRequiredNoteMsg: 'يرجى تقديم عنوان الملاحظة ومحتوى الاستشارة.', docNoteSavedMsg: 'تمت إضافة ملاحظة الاستشارة السريرية إلى السجل الطبي.',
    docDeleteNoteTitle: 'حذف الملاحظة؟', docDeleteNoteMsg: 'إزالة ملاحظة الاستشارة هذه؟',
    docContactUpdatedTitle: 'تم التحديث', docContactUpdatedMsg: 'تم حفظ بيانات اتصال الطبيب والعلاج.',
    docPhoneCallTitle: 'مكالمة هاتفية', docCallMsg: 'اتصل بـ {phone}', docEmailTitle: 'بريد إلكتروني', docEmailMsg: 'مراسلة {email}',
    docTherapyCatSpeech: 'النطق و AAC', docTherapyCatSensory: 'الحواس والهدوء',
    docTherapyCatOccupational: 'الروتين الوظيفي', docTherapyCatBehavioral: 'السلوك والتواصل الاجتماعي',
    docPrescribedGoalsTitle: 'الأهداف العلاجية الموصوفة',
    docPrescribedGoalsSub: 'تمارين مخصصة للنطق والتنظيم الحسي والروتين الوظيفي',
    docPrescribeGoal: 'وصف هدف', docCompletedBadge: 'مكتمل', docInProgress: 'قيد التنفيذ',
    docPrescribedByLine: 'وصفه: {doctor} · تاريخ التعيين: {date}', docProgressLabel: 'التقدم:', docIncrementPrefix: '+1',
    docNoGoalsYet: 'لا توجد أهداف علاجية موصوفة بعد.', docPrescribeFirstGoal: '+ وصف أول هدف',
    docConsultationNotesTitle: 'ملاحظات الاستشارة والخطة التعليمية الفردية',
    docConsultationNotesSub: 'سجلات العلاج والمعالم التطورية وملاحظات الأخصائيين',
    docAddNote: 'إضافة ملاحظة', docByAuthorDate: 'بواسطة {author} · {date}', docKeyRecommendations: 'التوصيات الرئيسية:',
    docNoNotesYet: 'لم يتم تسجيل ملاحظات استشارية بعد.', docAddClinicalObservation: '+ إضافة ملاحظة سريرية',
    docContactTitle: 'اتصال الطبيب والمعالج',
    docContactSub: 'تواصل طبي مباشر لإرشاد الوالدين والاستفسارات السريرية',
    docEditContact: 'تعديل جهة الاتصال', docCallDoctor: 'اتصل بالطبيب', docEmailClinic: 'راسل العيادة', docShareIep: 'مشاركة الخطة',
    docClinicalInstructions: 'تعليمات سريرية لمقدمي الرعاية:',
    docPermissionsInfo: '✅ فعّل أو عطّل فئات المحتوى. ستُعرض فقط الفئات المعتمدة لـ {name}.',
    docEnableAll: 'تفعيل الكل', docDisableAll: 'تعطيل الكل',
    docPrescribeGoalModalTitle: 'وصف هدف علاجي', docPrescribeGoalModalSub: 'تعيين تمرين للنطق أو الحواس أو التأهيل الوظيفي',
    docGoalTitleLabel: 'عنوان الهدف', docGoalTitlePlaceholder: 'مثال: نطق 5 كلمات في لعبة الصورة والكلام',
    docTherapyCategoryLabel: 'فئة العلاج', docTargetCountLabel: 'العدد المستهدف', docUnitLabel: 'الوحدة (مثال: كلمات، مرات)',
    docPrescribingClinicianLabel: 'الطبيب الواصف', docPrescribingClinicianPlaceholder: 'مثال: د. سارة ميتشل',
    docAssignGoal: 'تعيين الهدف',
    docAddNoteModalTitle: 'إضافة ملاحظة استشارة سريرية', docAddNoteModalSub: 'تسجيل التقدم والتقييم وتوصيات الرعاية',
    docNoteTitleLabel: 'عنوان الملاحظة', docNoteTitlePlaceholder: 'مثال: تقييم النطق واللغة نصف الأسبوعي',
    docAttendingDoctorLabel: 'الطبيب المعالج / الأخصائي', docDoctorNamePlaceholder: 'اسم الطبيب',
    docClinicalObservationLabel: 'الملاحظة والتقييم السريري',
    docClinicalObservationPlaceholder: 'يُظهر المريض تحسناً في الانتباه المشترك ويستخدم شريط جملة من 3 بطاقات باستمرار...',
    docCaregiverRecsLabel: 'توصيات لمقدم الرعاية (سطر لكل توصية)',
    docCaregiverRecsPlaceholder: 'التدرب على طلب الطعام أثناء العشاء\nتقليل وقت الشاشة الحسي قبل النوم',
    docSaveConsultation: 'حفظ الاستشارة',
    docEditDoctorProfileTitle: 'تعديل ملف الطبيب والعيادة', docEditDoctorProfileSub: 'معلومات الاتصال المرئية للوالدين',
    docDoctorNameLabel: 'اسم الطبيب / الأخصائي', docClinicalSpecialityLabel: 'التخصص السريري',
    docClinicNameLabel: 'اسم المستشفى أو العيادة', docPhoneLabel: 'الهاتف / خط المساعدة', docEmailLabel: 'البريد الإلكتروني',
    docConsultingHoursLabel: 'ساعات الاستشارة والتعليمات', docSaveContact: 'حفظ جهة الاتصال',
    docDefaultDoctorName: 'د. سارة ميتشل، أخصائية نطق', docDefaultSpeciality: 'أخصائية أمراض النطق واللغة',
    docDefaultClinicName: 'مركز العلاج التطوري للأطفال',
    docDefaultContactNotes: 'متاحة من الاثنين إلى الخميس 09:00 - 16:00 لاستشارات النطق.',
    docDefaultDisplayNotes: 'ساعات الاستشارة: الاثنين–الخميس 09:00 - 16:00. اتصل لتحديثات العلاج.',
    docReportTemplate: '=====================================================\nتقرير Angel Talk للعلاج والتقييم السريري\n=====================================================\nPatient: {patient}\nAge: {age} years\nDiagnoses: {diagnoses}\nEnrolled: {enrolled}\nReport Date: {reportDate}\n\nATTENDING DOCTOR / CLINICIAN:\n{doctorLine}\nClinic: {clinicName}\nContact: {phone} | {email}\n\nA-TO-Z COMMUNICATION PERFORMANCE METRICS:\n-----------------------------------------------------\n• إجمالي الكلمات المتواصل بها: {totalWords} نقرة كلمة\n• تنوع المفردات الفريدة: {uniqueCount} كلمة فريدة\n• الجُمل الكاملة المُكوَّنة: {sentencesSpoken} جملة\n• أطول جملة منطوقة: {longestLen} كلمة\n  الكلمات الحرفية: "{verbatim}"\n• الالتزام بالروتين البصري: {avgAdherence}% بالمتوسط\n• أيام النشاط المتتالية: {consecutiveDays} يوم\n\nأهم مفردات التواصل:\n-----------------------------------------------------\n{topWords}\n\nالأهداف العلاجية الموصوفة:\n-----------------------------------------------------\n{activeGoals}\n\nالملاحظات والمشاهدات السريرية:\n-----------------------------------------------------\n{recentNotes}\n=====================================================',
    docNoVocabDataRecorded: 'لا توجد بيانات مفردات مسجلة بعد.', docNoGoalsAssignedYet: 'لم يتم تعيين أهداف علاجية محددة بعد.',
    docNoNotesLoggedYet: 'لم يتم تسجيل ملاحظات استشارية سريرية بعد.',
    docOccurrencesSuffix: '{count} مرة', docRecommendationsPrefix: 'التوصيات: ',
    docDefaultRecommendation: 'الاستمرار في ممارسة لوحة صور AAC يومياً', docDoctorFallback: 'الطبيب',
    psFamilySection: 'الأسرة وملفات الأطفال', psManageProfiles: 'إدارة {count} ملف طفل مسجل',
    psEnrolledBadge: '{count} مسجل', psEnrollSubtitle: 'سجّل طفلاً بمسح الوجه بالكاميرا أو بصورة',
    psClinicalSection: 'الإدارة السريرية والعلاجية', psDoctorPanelSub: 'وصف أهداف الخطة التعليمية الفردية وعرض مقاييس الأداء الشاملة',
    psClinicalBadge: 'سريري',
    psAdminTitle: 'مركز تحكم المشرف', psAdminSub: 'لوحات AAC، مفاتيح API للذكاء الاصطناعي، تصدير تحليلات CSV',
    psPinProtectedBadge: 'محمي برمز',
    psContentSection: 'استوديو لوحات ومحتوى AAC', psCategoryBuilderTitle: 'منشئ الفئات والبطاقات',
    psCategoryBuilderSub: 'إنشاء مجلدات مفردات مخصصة وتحميل الرموز',
    psSentencePictureTitle: 'الصورة والكلام الجُملي', psSentencePictureSub: 'أداة بناء تواصل من الصوت إلى الصورة بمساعدة الذكاء الاصطناعي',
    psSystemSection: 'النظام وإمكانية الوصول', psAccessibilitySub: 'اللغة، سرعة تركيب الكلام، أمان الكشك',
    psParentAreaBadge: 'منطقة الوالدين', psHeaderSub: 'مركز إدارة مقدم الرعاية والشؤون السريرية',
    psWelcomeCaregiver: 'أهلاً، مقدم الرعاية!', psChildrenConfigured: 'تم إعداد {count} طفل · {stars} ⭐ مكتسبة عبر اللوحات',
    psChildrenLabel: 'الأطفال', psActiveStatus: 'نشط', psOfflineAac: 'AAC دون اتصال', psIepReady: 'جاهز للخطة الفردية',
    psReturnToScanner: 'العودة إلى ماسح التعرف على الوجه',
    spExample1: 'القطة السوداء تحت الطاولة', spExample2: 'كلب بني صغير خلف الشجرة الكبيرة',
    spExample3: 'ثلاث تفاحات حمراء في السلة', spExample4: 'الطائر الأزرق فوق البيت',
    spExample5: 'الفتاة جالسة على الكرسي',
    spNoPollinationsToken: 'الصور الحقيقية تحتاج إلى رمز Pollinations مجاني (auth.pollinations.ai) في .env — المشهد المبني معروض الآن.',
    spEngineSlow: 'محرك الصور بطيء — لا يزال المشهد المبني معروضاً.',
    spNoAiEngine: 'الرسم الحي بالذكاء الاصطناعي يحتاج إلى رمز Pollinations مجاني (auth.pollinations.ai) في .env، أو مفتاح OpenAI. المشهد الفوري ومكتبة 14,800 كلمة لا تزال تعمل.',
    spCouldNotMake: 'تعذر إنشاء الصورة.',
    spEngineTooLong: 'محرك الصور يستغرق وقتاً طويلاً. يتم عرض المشهد الفوري — اضغط على AI للمحاولة مرة أخرى.',
    spEngineNoResponse: 'لم يستجب محرك الصور. اضغط على AI للمحاولة مرة أخرى.',
    spSpeakKeyboardTitle: 'تحدث باستخدام لوحة المفاتيح',
    spSpeakKeyboardMsg: 'اضغط على مربع النص واستخدم الميكروفون في لوحة المفاتيح — تتحدث الصورة أثناء كلامك.',
    spDidntCatchTitle: 'لم أفهم ذلك', spTryAgainType: 'حاول مرة أخرى أو اكتبها.',
    spBadgeLibrary: 'المكتبة', spBadgeLibraryNew: 'المكتبة · جديد', spBadgeLibraryAi: 'المكتبة · AI', spBadgeInstant: 'فوري',
    spHeaderTitle: 'الصورة والكلام', spHeaderSubWithLib: 'مكتبة الصور: {words} كلمة · {books} من الكتب{saved}',
    spHeaderSubSavedSuffix: ' · {n} محفوظ', spHeaderSubDefault: 'قل أو اكتب جملة — تُبنى الصورة أثناء حديثك',
    spUnderstanding: 'جارٍ الفهم…', spMakingPicture: 'جارٍ إنشاء الصورة…',
    spKeepTalkingOn: 'وضع الاستمرار بالحديث مفعّل', spStartOver: 'البدء من جديد', spRedraw: 'إعادة الرسم', spRealPicture: 'صورة حقيقية',
    spMicHintAgent: 'تحدث بشكل طبيعي — يفهم وكيل {agent} الجُمل الكاملة. "قطة تحت الطاولة"، "فتاة تبكي بجانب المسجد"، "حرّك الكتاب خلف الكرسي"، "أزل القطة". "صورة حقيقية" تحوّل المشهد كله إلى رسمة واحدة بالذكاء الاصطناعي.',
    spMicHintNoAgent: 'تغيير واحد في كل مرة: "طاولة" · "قطة تحت الطاولة" · "افتح عيني القطة" · "فتاة تبكي". أضف EXPO_PUBLIC_GROQ_API_KEY لفهم الكلام الحر.',
    spInstantScene: 'مشهد فوري', spMakeFullPicture: 'إنشاء صورة كاملة بالذكاء الاصطناعي',
    spUnderstoodWell: 'مفهوم جيداً', spPartlyUnderstood: 'مفهوم جزئياً',
    spUnderstoodSuffix: '· {pct}% — اضغط "AI" لأي شيء لا يستطيع المشهد الفوري رسمه.',
    spTypeSentencePlaceholder: 'اكتب جملة، أو اضغط على الميكروفون في لوحة المفاتيح…',
    spListeningTapStop: 'أستمع… اضغط للتوقف', spTurningSpeechToText: 'جارٍ تحويل الكلام إلى نص…', spSpeakSentence: 'انطق جملة',
    spKeyboardMicHint2: 'أو اضغط على مربع النص واستخدم ميكروفون لوحة المفاتيح — تتحدث الصورة كلمة بكلمة.',
    spReadAloud: 'اقرأ بصوت عالٍ', spClear: 'مسح', spTrySentence: 'جرّب جملة', spScienceConcepts: 'مفاهيم علمية',
    spBigHint: 'المشهد الفوري يعمل دون اتصال وهو الأساس دائماً. "AI" يستخدم محرك صور مجاني (لا حاجة لمفتاح)؛ يعمل محرك أدق إذا ربطت مفتاح OpenAI بـ ✨. المفهوم: الألوان، الأحجام (صغير/كبير)، الأعداد، الأشياء ({things}…)، الأفعال (يجري، يجلس…)، المواضع (تحت، على، فوق، خلف، أمام، بجانب، داخل)، الكائنات ({objects}…).',
    spModalTitle: 'صور أوضح بالذكاء الاصطناعي (اختياري)',
    spModalBody: 'محرك الذكاء الاصطناعي المجاني يعمل بالفعل بدون مفتاح. الصق مفتاح OpenAI API هنا لرسوم أعلى جودة. يُخزَّن فقط على هذا الجهاز. اتركه فارغاً واحفظ لقطع الاتصال.',
    spKeyPlaceholder: 'sk-…',
    spFlowerLabel: 'زهرة', spSeedsLabel: 'بذور', spFlowerAbsent: 'بلا زهرة', spSeedsAbsent: 'بلا بذور',
    spBackboneHighlighted: 'العمود الفقري مميز', spNoBackbone: 'بلا عمود فقري',
    accKioskOption2Title: 'وضع الكشك — الخيار 2 (موصى به)', accBestEffortLock: 'قفل داخل التطبيق بأفضل جهد (نشط دائماً):',
    accBackDisabled: '• زر الرجوع في أجهزة أندرويد معطّل',
    accScreenAwake: '• تبقى الشاشة مضاءة طالما الطفل داخل التطبيق',
    accExitTempBullet: '• للخروج مؤقتاً من أي شاشة للطفل: اضغط على الزاوية العلوية اليمنى للشاشة 5 مرات متتالية. ستظهر نافذة إدخال الرمز.',
    accAndroidHardenedTitle: 'أندرويد — وضع مالك الجهاز المعزز (للأجهزة المخصصة):',
    accInstallApkBullet: '• ثبّت تطبيق Angel Talk أولاً، ثم فعّل الجهاز كمالك جهاز عبر ADB أو نظام إدارة الأجهزة (MDM):',
    accToggleKioskBullet: '• بعد التفعيل، فعّل "الكشك" أعلاه — سيستخدم التطبيق وضع قفل المهام في أندرويد لمنع الرئيسية والنظرة العامة والإعدادات.',
    accFactoryResetBullet: '• يتطلب أن يكون الجهاز غير مُهيّأ / بحالة إعادة ضبط المصنع قبل أول تثبيت للتطبيق.',
    accIosGuidedTitle: 'iOS (آيباد/آيفون) — الوصول الموجّه (مطلوب — لا يمكن لأي تطبيق فرضه):',
    accIosSettingsBullet: '• افتح إعدادات iOS ← إمكانية الوصول ← الوصول الموجّه ← فعّله',
    accIosPasscodeBullet: '• اضبط رمز الوصول الموجّه (منفصل عن رمز هذا التطبيق)',
    accIosLaunchBullet: '• شغّل Angel Talk، اضغط على الزر الجانبي ثلاث مرات، ثم اضغط الوصول الموجّه ← بدء',
    accIosExitBullet: '• للخروج، اضغط ثلاث مرات مرة أخرى وأدخل رمز الوصول الموجّه الخاص بـ iOS',
    accPasscodeModalTitle: 'رمز مرور المشرف', accPasscodeModalBody: '4 أرقام. اتركه فارغاً واحفظ لإزالة الرمز.',
    accPasscodePlaceholder: '••••',
    accPixabayModalTitle: 'مفتاح Pixabay API',
    accPixabayModalBody: 'مفتاح مجاني من pixabay.com/api/docs. يتيح البحث عن الصور في محرر الكلمات. بحث رموز AAC يعمل بدونه.',
    accPixabayPlaceholder: 'الصق المفتاح…',
    accRestoreModalTitle: 'استعادة من نسخة احتياطية', accRestoreModalBody: 'الصق نص النسخة الاحتياطية. سيستبدل هذا اللوحة الحالية.',
    accRestorePlaceholder: '{ ... }', accRestoreBtn: 'استعادة',
    accPasscodeInvalid: 'يجب أن يتكون الرمز من 4 أرقام بالضبط.', accNothingToBackup: 'لا يوجد شيء لنسخه احتياطياً بعد.',
    accInvalidBackupText: 'هذا ليس نص نسخة احتياطية صالحاً.',
    accRestoreCompleteTitle: 'اكتملت الاستعادة', accRestoreWarningsTitle: 'تمت الاستعادة مع تحذيرات',
    accRestoreSummary: '{cats} مجلد · {words} كلمة · {images} صورة',
    vcmBookLabel: 'كتاب',
    hubTitle: 'مركز ملاك توك (Angel Talk Hub)',
    activeChildLabel: 'الطفل النشط: {name}',
    mainAppsSection: 'التطبيقات والأقسام الرئيسية',
    homeHub: 'الرئيسية (Home Hub)',
    aacTalkBoard: 'لوحة التحدث AAC',
    dailyRoutineSchedule: 'جدول الروتين اليومي',
    speechLearningGames: 'ألعاب النطق والتعلم',
    doctorProgressReports: 'تقارير الطبيب ومتابعة التقدم',
    parentClinicalToolsSection: 'أدوات الوالدين والأخصائي',
    visualSocialStoriesTitle: 'قصص اجتماعية بصرية',
    visualSocialStoriesDesc: 'أدلة ناطقة لزيارة طبيب الأسنان، الحلاقة، المدرسة والمشاعر',
    addChildProfileTitle: 'إضافة ملف طفل',
    addChildProfileDesc: 'تسجيل الطفل مع التعرف على الوجه، العمر والتشخيص',
    myCategoriesWordsTitle: 'فئاتي وكلماتي',
    myCategoriesWordsDesc: 'تنظيم الرفوف، الكلمات، الإخفاء/الإظهار والحذف',
    categoryBuilderGenTitle: 'منشئ ومولد الفئات',
    categoryBuilderGenDesc: 'إنشاء فئات جديدة من القوائم أو قوالب الذكاء الاصطناعي',
    voiceCommandMatchTitle: 'مطابقة الأوامر الصوتية',
    voiceCommandMatchDesc: 'التدرب على العبارات المنطوقة مع مطابقة بصرية مباشرة',
    phraseLibraryTitle: 'مكتبة العبارات',
    phraseLibraryDesc: 'إدارة عبارات الإطلاق، مستويات النطق والأهداف',
    contentReviewQueueTitle: 'قائمة مراجعة المحتوى',
    contentReviewQueueDesc: 'مراجعة واعتماد أو رفض مدخلات المفردات',
    parentPortalAddTitle: 'بوابة الوالدين وإضافة طفل',
    parentPortalAddDesc: 'تسجيل الأطفال، التعرف على الوجه والملفات الشخصية',
    settingsAccessibilityTitle: 'الإعدادات وإمكانية الوصول',
    settingsAccessibilityDesc: 'سرعة النطق، قفل PIN، النسخ الاحتياطي وخيارات الصوت',
        switchChildFaceTitle: 'تبديل الطفل / تسجيل الدخول بالوجه',
    switchChildFaceDesc: 'تسجيل الدخول لملف طفل آخر عبر مسح الكاميرا',
    caregiverSpaceBadge: 'مساحة الوالدين ومقدم الرعاية',
    shapeVocabTitle: 'تطوير مفردات الطفل',
    shapeVocabDesc: 'اجعل الكلمات اليومية قريبة، أضف رفوفاً جديدة، وراقب ما يدعم سهولة التواصل.',
    voiceAddBtn: 'إضافة بالصوت',
    bulkAddBtn: 'إضافة متعددة',
    addWordBtn: '+ إضافة كلمة',
    shelvesHeader: 'الرفوف',
    shelvesSub: 'نظّم الكلمات بطريقة مألوفة وسهلة للطفل.',
    newShelfBtn: 'رف جديد',
    editSubCatPill: 'تعديل الفئة الفرعية',
    editShelfPill: 'تعديل الرف',
    findAWordPlaceholder: 'ابحث عن كلمة…',
    colWord: 'الكلمة',
    colUseCount: 'مرات الاستخدام',
    colLastUsed: 'آخر استخدام',
    colActions: 'إجراءات',
    timesUsed: '{count} مرات',
    lastUsedToday: 'اليوم',
    lastUsedNotYet: 'ليس بعد',
    hiddenFromChildNote: 'مخفية عن الطفل',
    noWordsInShelfTitle: 'لا توجد كلمات في هذا الرف',
    noWordsInShelfSub: 'اضغط على "+ إضافة كلمة" أعلاه لإضافة مفردات إلى {name}.',
    addSubCategorySidebar: 'إضافة فئة فرعية',
    wordsInSubCatMeta: '{count} كلمات · في الفئة الفرعية "{name}"',
    wordsInShelfAllMeta: '{count} كلمات · في "{name}" (جميع الفئات الفرعية)',
    wordsOnDeviceMeta: '{count} كلمات · مستخدمة على هذا الجهاز',
    hiddenShelfNote: ' · (مخفي عن الطفل)',
    deleteConfirmTitle: 'حذف {type}',
    deleteConfirmMsg: 'هل أنت متأكد من رغبتك في حذف "{name}"؟',
    confirmDeleteBtn: 'حذف',
    cancelBtn: 'إلغاء',
    saveChangesBtn: 'حفظ التغييرات',
  },
  'ur-PK': {
    appName: 'اینجل ٹاک',
    scanning: 'آپ کو ڈھونڈ رہے ہیں…',
    welcome: 'خوش آمدید!',
    parentSetup: 'والدین سیٹ اپ',
    addChild: 'بچہ شامل کریں',
    childName: 'بچے کا نام',
    childAge: 'عمر',
    diagnosis: 'ضروریات',
    save: 'محفوظ',
    cancel: 'منسوخ',
    next: 'اگلا',
    back: 'واپس',
    schedule: 'میرا دن',
    aacBoard: 'بات کریں',
    rewards: 'میرے ستارے',
    calmDown: 'سکون لیں',
    settings: 'ترتیبات',
    parentHub: 'تمام بچے',
    doctorPanel: 'ڈاکٹر پینل',
    breatheIn: 'سانس لیں',
    breatheOut: 'سانس چھوڑیں',
    hold: 'رکیں',
    wellDone: 'شاباش! ⭐',
    stars: 'ستارے',
    badges: 'بیجز',
    speak: 'بولیں',
    clear: 'صاف',
    fontSize: 'حروف کا سائز',
    highContrast: 'زیادہ کنٹراسٹ',
    sound: 'آواز',
    reduceMotion: 'حرکت کم کریں',
    language: 'زبان',
    enrollFace: 'چہرہ رجسٹر کریں',
    lookAtCamera: 'کیمرے کی طرف دیکھیں 😊',
    capturingFace: 'ہو گیا! 📸',
    matchFound: 'آپ مل گئے!',
    noMatch: 'نیا دوست!',
    hello: 'سلام',
    morning: 'صبح بخیر',
    afternoon: 'دوپہر بخیر',
    evening: 'شام بخیر',
    night: 'شب بخیر',
    content: 'میری تعلیم',
    doctorApproved: 'ڈاکٹر منظور',
    selectLanguage: 'اپنی زبان منتخب کریں',
    parentPin: 'والدین کا علاقہ',
    myDay: 'میرا دن',
    breatheStart: 'شروع کرنے کے لیے دائرے کو دبائیں',
    feelingCalm: 'سکون محسوس ہو رہا ہے 🌿',
    tapToSpeak: 'بولنے کے لیے تصویر دبائیں',
    sentence: 'میرا جملہ:',
    needsCategory: 'ضروریات',
    feelingsCategory: 'احساسات',
    peopleCategory: 'لوگ',
    actionsCategory: 'افعال',
    foodCategory: 'کھانا',
    scanningMessage: 'کیمرے کی طرف دیکھیں',
    enrollStep1: 'مرحلہ 1: سیدھا دیکھیں',
    enrollStep2: 'مرحلہ 2: تھوڑا بائیں مڑیں',
    enrollStep3: 'مرحلہ 3: تھوڑا دائیں مڑیں',
    childAdded: 'بچہ شامل ہو گیا! 🎉',
    noChildren: 'ابھی کوئی بچہ نہیں۔ شامل کریں!',
    deleteChild: 'ہٹائیں',
    editChild: 'ترمیم',
    allowedContent: 'اجازت یافتہ مواد',
    hello_child: 'سلام',
    talk: 'بات کریں',
    home: 'ہوم',
    buildSentence: 'جملہ بنانے کے لیے تصویروں پر ٹیپ کریں…',
    speakSentence: 'جملہ بولیں',
    removeLast: 'آخری لفظ ہٹائیں',
    clearSentence: 'جملہ صاف کریں',
    makeAWord: 'لفظ بنائیں',
    emptyFolder: 'یہ فولڈر خالی ہے۔ مائیک بٹن سے یا بورڈ ایڈیٹر میں الفاظ شامل کریں۔',
    sayTheWord: 'لفظ بلند آواز میں بولیں',
    sayTheWordHint: 'مائیک دبائیں، ایک لفظ بولیں، پھر رکنے کے لیے دوبارہ دبائیں۔',
    tapToStart: 'شروع کرنے کے لیے ٹیپ کریں',
    listeningTap: 'سن رہا ہوں… رکنے کے لیے ٹیپ کریں',
    checkTheWord: 'کیا یہ صحیح لفظ ہے؟',
    checkTheWordHint: 'آواز غلط سنی جا سکتی ہے۔ آگے بڑھنے سے پہلے ٹھیک کریں۔',
    typeTheWord: 'لفظ لکھیں…',
    hearIt: 'سنیں',
    nextFindPicture: 'اگلا — تصویر ڈھونڈیں',
    pickPicture: 'تصویر منتخب کریں',
    pickPictureHint: 'یہ تلاش کی گئی تصویریں ہیں۔ سب سے واضح چنیں یا اپنی تصویر لیں۔',
    symbols: 'علامتیں',
    photos: 'تصاویر',
    aiMade: 'اے آئی',
    camera: 'کیمرا',
    gallery: 'گیلری',
    useSymbol: 'علامت استعمال کریں',
    tryAgain: 'دوبارہ کریں',
    useThisPicture: 'یہ تصویر استعمال کریں',
    whichFolder: 'یہ کس فولڈر میں جائے گا؟',
    newFolder: 'نیا فولڈر',
    createSave: 'بنائیں اور محفوظ کریں',
    wordAdded: 'لفظ شامل ہو گیا',
    wordAddedHint: 'ٹائل دبانے پر بچہ ایپ سے یہ سنتا ہے۔',
    addAnother: 'ایک اور شامل کریں',
    done: 'مکمل',
    skipTypeInstead: 'چھوڑیں — لفظ لکھیں',
    step: 'مرحلہ',
    of: 'از',
    reopenForLanguage: 'زبان اور متن کی سمت مکمل تبدیل کرنے کے لیے ایپ بند کر کے دوبارہ کھولیں۔',
    games: 'کھیل',
    progress: 'ترقی',
    moodQuestion: 'آج آپ کیسا محسوس کر رہے ہیں؟', quickExpressHeading: 'فوری اظہار',
    feelingTag: 'محسوس ہو رہا ہے', sayIAmFeeling: 'آج مجھے محسوس ہو رہا ہے', bathroom: 'باتھ روم',
    needHelpPhrase: 'مجھے مدد چاہیے، براہ کرم!', needWaterPhrase: 'مجھے پانی چاہیے، براہ کرم۔',
    needBathroomPhrase: 'مجھے باتھ روم جانا ہے۔', pleaseStopPhrase: 'براہ کرم رکیں۔',
    completedToday: '✓ آج مکمل ہوا!', startExercise: 'مشق شروع کریں ←',
    therapyTargetBadge: 'ڈاکٹر کا تھراپی ہدف', tapToPracticeNow: 'مشق کے لیے دبائیں',
    doctorsPlan: 'ڈاکٹر کا منصوبہ', unitWords: 'الفاظ', viewFullSchedule: 'پورا شیڈول دیکھیں',
    defaultSpeechGoalTitle: 'اے اے سی بورڈ سے ۳ الفاظ بولیں', doctorsDailyGoal: 'ڈاکٹر کا روزانہ ہدف',
    visualRoutineSubtitle: 'بصری روٹین اور فرسٹ-دین گائیڈ', readAloudBtn: 'سنیں',
    activitiesCompletedSuffix: 'سرگرمیاں مکمل',
    statusCompleted: 'مکمل ✓', statusHappeningNow: 'ابھی ہو رہا ہے', statusUpcoming: 'آنے والا',
    addCustomRoutineTask: '+ نیا روٹین ٹاسک شامل کریں', addCustomRoutineActivity: 'حسب ضرورت روٹین سرگرمی شامل کریں',
    activityNameLabel: 'سرگرمی کا نام', activityNamePlaceholder: 'مثلاً: اسپیچ سیشن، دانت صاف کرنا، کھیل کا میدان…',
    scheduledTimeLabel: 'مقررہ وقت', scheduledTimePlaceholder: 'مثلاً: ۱۱:۳۰',
    activityIconLabel: 'سرگرمی کا آئیکن', addToScheduleBtn: 'شیڈول میں شامل کریں',
    firstThenBoardTitle: 'پہلے - پھر بورڈ',
    firstThenSubtitle: 'ایک واضح بصری ڈھانچہ جو آپ کے بچے کو سرگرمیوں کے درمیان منتقلی میں مدد دیتا ہے۔',
    firstLabel: '۱. پہلے', thenLabel: '۲. پھر', activityFallback: 'سرگرمی', rewardPlayFallback: 'انعام / کھیل',
    markFirstDoneBtn: 'پہلا کام مکمل کریں!',
    requiredAlertTitle: 'ضروری', requiredAlertMsg: 'براہ کرم سرگرمی کا نام درج کریں۔',
    rightNowTimeFor: 'ابھی وقت ہے:', allTasksFinished: 'آج کے تمام کام مکمل ہو گئے! شاندار کام!',
    finishedGreatJob: '۔ مکمل ہوا! شاندار کام!',
    namePlaceholder: 'مثلاً: علی، سارہ، احمد', agePlaceholder: 'مثلاً: ۵', selectAllThatApply: '(جو لاگو ہو منتخب کریں)',
    faceCaptureFailed: 'آپ کا چہرہ کیپچر نہیں ہو سکا۔ دوبارہ کوشش کریں۔',
    capturingEllipsis: 'کیپچر ہو رہا ہے…', captureBtn: 'کیپچر کریں', finishBtn: 'مکمل کریں!',
    hasBeenAdded: 'شامل کر دیا گیا ہے!', faceUnlockHint: 'اب وہ چہرے کی شناخت سے ایپ کھول سکتے ہیں۔',
    startWithChild: 'شروع کریں', doneCheck: '✓ مکمل', addAnotherChild: 'ایک اور بچہ شامل کریں',
    positionFaceHint: 'اپنا چہرہ دائرے میں رکھیں', holdSteadyHint: 'ساکت رہیں، آپ کو ڈھونڈ رہے ہیں… 😊',
    noChildEnrolled: 'ابھی تک کوئی بچہ شامل نہیں کیا گیا۔', checkingFaceEllipsis: 'چہرہ چیک ہو رہا ہے…',
    adjustingLighting: 'روشنی ایڈجسٹ ہو رہی ہے (کوشش {n}/۳)…',
    didntCatchFace: 'چہرہ نہیں پہچانا جا سکا', cameraNotAvailable: 'کیمرہ دستیاب نہیں',
    scanningFaceEllipsis: 'چہرہ اسکین ہو رہا ہے…', lookedEverywhere: 'ہر جگہ دیکھ لیا!', cameraUnavailableMsg: 'کیمرہ دستیاب نہیں',
    scanAgainBtn: 'دوبارہ اسکین کریں', selectChildBtn: 'بچہ منتخب کریں', continueWithoutCamera: 'کیمرے کے بغیر جاری رکھیں',
    selectChildProfileBtn: '👦 بچے کا پروفائل منتخب کریں', adminPortalBtn: '🛠️ ایڈمن پورٹل',
    chooseChildProfileTitle: 'بچے کا پروفائل منتخب کریں', tapChildProfileHint: 'اپنے بچے کا پروفائل دبائیں تاکہ سیشن کھل جائے:',
    ageLabel: 'عمر',     welcomeBack: 'خوش آمدید، {name}! 🎉',
    hubTitle: 'اینجل ٹاک ہب (Angel Talk Hub)',
    activeChildLabel: 'فعال بچہ: {name}',
    mainAppsSection: 'مرکزی ایپس اور ٹیبز',
    homeHub: 'ہوم ہب (Home Hub)',
    aacTalkBoard: 'بات چیت بورڈ (AAC)',
    dailyRoutineSchedule: 'روزمرہ شیڈول',
    speechLearningGames: 'بولنے اور سیکھنے کے کھیل',
    doctorProgressReports: 'ڈاکٹر اور پیشرفت کی رپورٹس',
    parentClinicalToolsSection: 'والدین اور معالج کے ٹولز',
    visualSocialStoriesTitle: 'بصری سماجی کہانیاں',
    visualSocialStoriesDesc: 'ڈینٹسٹ، حجامت، اسکول اور جذبات کے لیے بولتی کہانیاں',
    addChildProfileTitle: 'بچے کا پروفائل شامل کریں',
    addChildProfileDesc: 'چہرے کی شناخت، عمر اور تشخیص کے ساتھ اندراج',
    myCategoriesWordsTitle: 'میرے زمرے اور الفاظ',
    myCategoriesWordsDesc: 'شیلف، الفاظ، چھپانا/دکھانا اور حذف کرنا',
    categoryBuilderGenTitle: 'زمرہ بلڈر اور جنریٹر',
    categoryBuilderGenDesc: 'فہرستوں یا اے آئی سے نئے زمرے بنائیں',
    voiceCommandMatchTitle: 'آواز کا حکم میچنگ',
    voiceCommandMatchDesc: 'بولے گئے جملوں کی بصری مشق کریں',
    phraseLibraryTitle: 'جملوں کی لائبریری',
    phraseLibraryDesc: 'ٹرگر جملے اور تقریری اہداف کا انتظام کریں',
    contentReviewQueueTitle: 'مواد کا جائزہ کیو',
    contentReviewQueueDesc: 'نئے الفاظ کا جائزہ لیں، منظور یا مسترد کریں',
    parentPortalAddTitle: 'والدین پورٹل اور بچہ شامل کریں',
    parentPortalAddDesc: 'بچوں کا اندراج اور پروفائل مینجمنٹ',
    settingsAccessibilityTitle: 'ترتیبات اور رسائی',
    settingsAccessibilityDesc: 'آواز کی رفتار، پن کوڈ، بیک اپ اور آڈیو',
    switchChildFaceTitle: 'بچہ تبدیل کریں / فیس لاگ ان',
    switchChildFaceDesc: 'کیمرہ اسکین سے دوسرے بچے کا پروفائل کھولیں',
    caregiverSpaceBadge: 'نگہداشت کرنے والے کا شعبہ',
    shapeVocabTitle: 'بچے کے ذخیرہ الفاظ کو وسعت دیں',
    shapeVocabDesc: 'روزمرہ کے الفاظ کو قریب رکھیں، نئے شیلف بنائیں، اور رابطے کو آسان بنائیں۔',
    voiceAddBtn: 'آواز سے شامل کریں',
    bulkAddBtn: 'ایک ساتھ شامل کریں',
    addWordBtn: '+ لفظ شامل کریں',
    shelvesHeader: 'شیلف',
    shelvesSub: 'الفاظ کو آسان اور مانوس انداز میں ترتیب دیں۔',
    newShelfBtn: 'نیا شیلف',
    editSubCatPill: 'ذیلی زمرہ تبدیل کریں',
    editShelfPill: 'شیلف تبدیل کریں',
    findAWordPlaceholder: 'لفظ تلاش کریں…',
    colWord: 'لفظ',
    colUseCount: 'استعمال کی تعداد',
    colLastUsed: 'آخری استعمال',
    colActions: 'کارروائیاں',
    timesUsed: '{count} بار',
    lastUsedToday: 'آج',
    lastUsedNotYet: 'ابھی تک نہیں',
    hiddenFromChildNote: 'بچے سے پوشیدہ',
    noWordsInShelfTitle: 'اس شیلف میں کوئی لفظ نہیں ہے',
    noWordsInShelfSub: 'نئے الفاظ شامل کرنے کے لیے اوپر "+ لفظ شامل کریں" پر ٹیپ کریں۔',
    addSubCategorySidebar: 'ذیلی زمرہ شامل کریں',
    wordsInSubCatMeta: '{count} الفاظ · ذیلی زمرہ "{name}" میں',
    wordsInShelfAllMeta: '{count} الفاظ · "{name}" میں (تمام ذیلی زمرے)',
    wordsOnDeviceMeta: '{count} الفاظ · اس ڈیوائس پر',
    hiddenShelfNote: ' · (بچے سے پوشیدہ)',
    deleteConfirmTitle: '{type} حذف کریں',
    deleteConfirmMsg: 'کیا آپ واقعی "{name}" کو حذف کرنا چاہتے ہیں؟',
    confirmDeleteBtn: 'حذف کریں',
    cancelBtn: 'منسوخ',
    saveChangesBtn: 'تبدیلیاں محفوظ کریں',
  },
  'hi-IN': {
    appName: 'Angel Talk',
    scanning: 'आपको ढूंढ रहे हैं…',
    welcome: 'स्वागत है!',
    parentSetup: 'माता-पिता सेटअप',
    addChild: 'बच्चा जोड़ें',
    childName: 'बच्चे का नाम',
    childAge: 'उम्र',
    diagnosis: 'ज़रूरतें',
    save: 'सहेजें',
    cancel: 'रद्द करें',
    next: 'आगे',
    back: 'वापस',
    schedule: 'मेरा दिन',
    aacBoard: 'बात करें',
    rewards: 'मेरे सितारे',
    calmDown: 'शांत हों',
    settings: 'सेटिंग्स',
    parentHub: 'सभी बच्चे',
    doctorPanel: 'डॉक्टर पैनल',
    breatheIn: 'सांस लें',
    breatheOut: 'सांस छोड़ें',
    hold: 'रुकें',
    wellDone: 'बहुत अच्छे! ⭐',
    stars: 'सितारे',
    badges: 'बैज',
    speak: 'बोलें',
    clear: 'साफ करें',
    fontSize: 'फ़ॉन्ट साइज़',
    highContrast: 'हाई कंट्रास्ट',
    sound: 'ध्वनि',
    reduceMotion: 'गति कम करें',
    language: 'भाषा',
    enrollFace: 'चेहरा दर्ज करें',
    lookAtCamera: 'कैमरे की ओर देखें 😊',
    capturingFace: 'हो गया! 📸',
    matchFound: 'मिल गए आप!',
    noMatch: 'नया दोस्त!',
    hello: 'नमस्ते',
    morning: 'सुप्रभात',
    afternoon: 'नमस्कार',
    evening: 'शुभ संध्या',
    night: 'शुभ रात्रि',
    content: 'मेरी पढ़ाई',
    doctorApproved: 'डॉक्टर अनुमोदित',
    selectLanguage: 'भाषा चुनें',
    parentPin: 'माता-पिता क्षेत्र',
    myDay: 'मेरा दिन',
    breatheStart: 'शुरू करने के लिए वृत्त दबाएं',
    feelingCalm: 'शांत महसूस हो रहा है 🌿',
    tapToSpeak: 'बोलने के लिए तस्वीर दबाएं',
    sentence: 'मेरा वाक्य:',
    needsCategory: 'ज़रूरतें',
    feelingsCategory: 'भावनाएं',
    peopleCategory: 'लोग',
    actionsCategory: 'क्रियाएं',
    foodCategory: 'खाना',
    scanningMessage: 'कैमरे की ओर देखें',
    enrollStep1: 'चरण 1: सीधे देखें',
    enrollStep2: 'चरण 2: थोड़ा बाएं मुड़ें',
    enrollStep3: 'चरण 3: थोड़ा दाएं मुड़ें',
    childAdded: 'बच्चा जोड़ा गया! 🎉',
    noChildren: 'अभी कोई बच्चा नहीं। जोड़ें!',
    deleteChild: 'हटाएं',
    editChild: 'संपादित करें',
    allowedContent: 'अनुमत सामग्री',
    hello_child: 'नमस्ते',
  },
  'es-ES': {
    appName: 'Angel Talk',
    scanning: 'Te estoy buscando…',
    welcome: '¡Bienvenido!',
    parentSetup: 'Configuración padres',
    addChild: 'Agregar niño',
    childName: 'Nombre del niño',
    childAge: 'Edad',
    diagnosis: 'Necesidades',
    save: 'Guardar',
    cancel: 'Cancelar',
    next: 'Siguiente',
    back: 'Atrás',
    schedule: 'Mi Día',
    aacBoard: 'Tablero de Habla',
    rewards: 'Mis Estrellas',
    calmDown: 'Calmarme',
    settings: 'Ajustes',
    parentHub: 'Todos los niños',
    doctorPanel: 'Panel del Doctor',
    breatheIn: 'Inhala',
    breatheOut: 'Exhala',
    hold: 'Aguanta',
    wellDone: '¡Muy bien! ⭐',
    stars: 'Estrellas',
    badges: 'Insignias',
    speak: 'Hablar',
    clear: 'Borrar',
    fontSize: 'Tamaño de letra',
    highContrast: 'Alto contraste',
    sound: 'Sonido',
    reduceMotion: 'Reducir movimiento',
    language: 'Idioma',
    enrollFace: 'Registrar cara',
    lookAtCamera: 'Mira la cámara 😊',
    capturingFace: '¡Listo! 📸',
    matchFound: '¡Te encontré!',
    noMatch: '¡Nuevo amigo!',
    hello: 'Hola',
    morning: 'Buenos días',
    afternoon: 'Buenas tardes',
    evening: 'Buenas noches',
    night: 'Buenas noches',
    content: 'Mi Aprendizaje',
    doctorApproved: 'Aprobado por médico',
    selectLanguage: 'Elige tu idioma',
    parentPin: 'Área de padres',
    myDay: 'Mi Día',
    breatheStart: 'Toca el círculo para empezar',
    feelingCalm: 'Me siento tranquilo 🌿',
    tapToSpeak: 'Toca una imagen para hablar',
    sentence: 'Mi frase:',
    needsCategory: 'Necesidades',
    feelingsCategory: 'Sentimientos',
    peopleCategory: 'Personas',
    actionsCategory: 'Acciones',
    foodCategory: 'Comida',
    scanningMessage: 'Por favor mira a la cámara',
    enrollStep1: 'Paso 1: Mira al frente',
    enrollStep2: 'Paso 2: Gira un poco a la izquierda',
    enrollStep3: 'Paso 3: Gira un poco a la derecha',
    childAdded: '¡Niño añadido! 🎉',
    noChildren: 'Sin niños aún. ¡Añade uno!',
    deleteChild: 'Eliminar',
    editChild: 'Editar',
    allowedContent: 'Contenido permitido',
    hello_child: 'Hola',
  },
  'fr-FR': {
    appName: 'Angel Talk',
    scanning: 'Je vous cherche…',
    welcome: 'Bienvenue!',
    parentSetup: 'Configuration parents',
    addChild: 'Ajouter un enfant',
    childName: "Nom de l'enfant",
    childAge: 'Âge',
    diagnosis: 'Besoins',
    save: 'Enregistrer',
    cancel: 'Annuler',
    next: 'Suivant',
    back: 'Retour',
    schedule: 'Ma Journée',
    aacBoard: 'Tableau de Parole',
    rewards: 'Mes Étoiles',
    calmDown: 'Me Calmer',
    settings: 'Paramètres',
    parentHub: 'Tous les enfants',
    doctorPanel: 'Panneau Médecin',
    breatheIn: 'Inspire',
    breatheOut: 'Expire',
    hold: 'Retiens',
    wellDone: 'Bravo! ⭐',
    stars: 'Étoiles',
    badges: 'Badges',
    speak: 'Parler',
    clear: 'Effacer',
    fontSize: 'Taille de police',
    highContrast: 'Contraste élevé',
    sound: 'Son',
    reduceMotion: 'Réduire le mouvement',
    language: 'Langue',
    enrollFace: 'Enregistrer le visage',
    lookAtCamera: 'Regardez la caméra 😊',
    capturingFace: 'Capturé! 📸',
    matchFound: 'Je vous ai trouvé!',
    noMatch: 'Nouvel ami!',
    hello: 'Bonjour',
    morning: 'Bonjour',
    afternoon: 'Bon après-midi',
    evening: 'Bonsoir',
    night: 'Bonne nuit',
    content: 'Mon Apprentissage',
    doctorApproved: 'Approuvé par médecin',
    selectLanguage: 'Choisissez votre langue',
    parentPin: 'Espace parents',
    myDay: 'Ma Journée',
    breatheStart: 'Touchez le cercle pour commencer',
    feelingCalm: 'Je me sens calme 🌿',
    tapToSpeak: 'Touchez une image pour parler',
    sentence: 'Ma phrase:',
    needsCategory: 'Besoins',
    feelingsCategory: 'Sentiments',
    peopleCategory: 'Personnes',
    actionsCategory: 'Actions',
    foodCategory: 'Nourriture',
    scanningMessage: 'Veuillez regarder la caméra',
    enrollStep1: 'Étape 1: Regardez droit devant',
    enrollStep2: 'Étape 2: Tournez un peu à gauche',
    enrollStep3: 'Étape 3: Tournez un peu à droite',
    childAdded: 'Enfant ajouté! 🎉',
    noChildren: "Pas d'enfants encore. Ajoutez-en un!",
    deleteChild: 'Supprimer',
    editChild: 'Modifier',
    allowedContent: 'Contenu autorisé',
    hello_child: 'Bonjour',
  },
};

export function t(key: TKey, lang: LanguageCode): string {
  return T[lang]?.[key] ?? T['en-US'][key] ?? key;
}

export function isRTL(lang: LanguageCode): boolean {
  return ['ar-SA', 'ur-PK'].includes(lang);
}

/** BCP-47 tag for the device speech engine. */
export function speechLocale(lang: LanguageCode): string {
  return lang; // "ar-SA", "ur-PK", "hi-IN", … all valid for expo-speech
}

/**
 * Apply layout direction for a language. Returns true when the direction
 * actually flipped — the caller must then ask the user to reopen the app,
 * because React Native only picks up an RTL change on a fresh start.
 */
export function applyLanguageDirection(_lang: LanguageCode): boolean {
  // Layout stays identical (LTR) in every language — only the text is translated.
  const want = false;
  I18nManager.allowRTL(false);
  if (I18nManager.isRTL !== want) {
    I18nManager.forceRTL(want);
    return true;
  }
  return false;
}

/** Starter board words, localised. Keys are the English label used as the id anchor. */
export const STARTER_WORDS: Record<LanguageCode | 'default', Record<string, string>> = {
  default: {},
  'en-US': {},
  'ar-SA': {
    I: 'أنا', you: 'أنت', want: 'أريد', more: 'المزيد', stop: 'توقف', go: 'اذهب', like: 'أحب', help: 'مساعدة', yes: 'نعم', no: 'لا',
    water: 'ماء', milk: 'حليب', juice: 'عصير', apple: 'تفاحة', banana: 'موز', bread: 'خبز', cookie: 'بسكويت', rice: 'أرز', chicken: 'دجاج', snack: 'وجبة خفيفة',
    happy: 'سعيد', sad: 'حزين', angry: 'غاضب', scared: 'خائف', tired: 'متعب', hurt: 'أتألم', sick: 'مريض', excited: 'متحمس', calm: 'هادئ', love: 'حب',
    mom: 'أمي', dad: 'أبي', me: 'أنا', teacher: 'المعلم', friend: 'صديق', baby: 'طفل', doctor: 'الطبيب', grandma: 'جدتي', grandpa: 'جدي', sister: 'أختي',
    eat: 'آكل', drink: 'أشرب', play: 'ألعب', sleep: 'أنام', read: 'أقرأ', walk: 'أمشي', run: 'أركض', sit: 'أجلس', wash: 'أغسل', open: 'افتح',
  },
  'ur-PK': {
    I: 'میں', you: 'آپ', want: 'چاہیے', more: 'اور', stop: 'رکو', go: 'جاؤ', like: 'پسند', help: 'مدد', yes: 'ہاں', no: 'نہیں',
    water: 'پانی', milk: 'دودھ', juice: 'جوس', apple: 'سیب', banana: 'کیلا', bread: 'روٹی', cookie: 'بسکٹ', rice: 'چاول', chicken: 'مرغی', snack: 'ناشتا',
    happy: 'خوش', sad: 'اداس', angry: 'غصہ', scared: 'ڈرا ہوا', tired: 'تھکا', hurt: 'درد', sick: 'بیمار', excited: 'پرجوش', calm: 'پرسکون', love: 'محبت',
    mom: 'امی', dad: 'ابو', me: 'میں', teacher: 'استاد', friend: 'دوست', baby: 'بچہ', doctor: 'ڈاکٹر', grandma: 'دادی', grandpa: 'دادا', sister: 'بہن',
    eat: 'کھانا', drink: 'پینا', play: 'کھیلنا', sleep: 'سونا', read: 'پڑھنا', walk: 'چلنا', run: 'دوڑنا', sit: 'بیٹھنا', wash: 'دھونا', open: 'کھولو',
  },
  'hi-IN': {}, 'es-ES': {}, 'fr-FR': {},
};

export function starterLabel(englishLabel: string, lang: LanguageCode): string {
  if (!englishLabel) return '';
  const match = STARTER_WORDS[lang]?.[englishLabel];
  if (match) return match;
  const lower = englishLabel.toLowerCase();
  for (const [k, v] of Object.entries(STARTER_WORDS[lang] ?? {})) {
    if (k.toLowerCase() === lower) return v;
  }
  return englishLabel;
}

/** Display translation for the answer words used in the Games screen. */
const GAME_ANSWERS: Partial<Record<LanguageCode, Record<string, string>>> = {
  'ar-SA': {
    Frog: 'ضفدع', Dog: 'كلب', Bird: 'طائر', Cat: 'قطة', Rabbit: 'أرنب', Cow: 'بقرة', Pig: 'خنزير', Horse: 'حصان',
    Red: 'أحمر', Orange: 'برتقالي', Yellow: 'أصفر', Green: 'أخضر', Blue: 'أزرق', Purple: 'بنفسجي', Brown: 'بني', Black: 'أسود',
    Circle: 'دائرة', Triangle: 'مثلث', Square: 'مربع', Star: 'نجمة', Diamond: 'معيّن', Heart: 'قلب',
    Happy: 'سعيد', Sad: 'حزين', Angry: 'غاضب', Scared: 'خائف', Sleepy: 'نعسان', Surprised: 'متفاجئ', Sick: 'مريض', Loved: 'محبوب',
  },
  'ur-PK': {
    Frog: 'مینڈک', Dog: 'کتا', Bird: 'پرندہ', Cat: 'بلی', Rabbit: 'خرگوش', Cow: 'گائے', Pig: 'سور', Horse: 'گھوڑا',
    Red: 'سرخ', Orange: 'نارنجی', Yellow: 'پیلا', Green: 'سبز', Blue: 'نیلا', Purple: 'جامنی', Brown: 'بھورا', Black: 'کالا',
    Circle: 'دائرہ', Triangle: 'مثلث', Square: 'مربع', Star: 'ستارہ', Diamond: 'ہیرا', Heart: 'دل',
    Happy: 'خوش', Sad: 'اداس', Angry: 'ناراض', Scared: 'خوفزدہ', Sleepy: 'نیند', Surprised: 'حیران', Sick: 'بیمار', Loved: 'محبوب',
  },
};
export function gameAnswerLabel(englishAnswer: string, lang: LanguageCode): string {
  return GAME_ANSWERS[lang]?.[englishAnswer] ?? englishAnswer;
}

/** Localised diagnosis / needs labels (a fixed set — not user data). */
const DIAGNOSIS_I18N: Partial<Record<LanguageCode, Record<string, string>>> = {
  'ar-SA': {
    'autism': 'التوحد (ASD)', 'down-syndrome': 'متلازمة داون', 'speech-delay': 'تأخر النطق / اللغة',
    'adhd': 'فرط الحركة ونقص الانتباه', 'hearing-impairment': 'ضعف السمع', 'visual-impairment': 'ضعف البصر',
    'dyslexia': 'عسر القراءة / صعوبة تعلم', 'cerebral-palsy': 'الشلل الدماغي / صعوبة حركية',
    'intellectual-disability': 'إعاقة ذهنية', 'sensory-processing': 'اضطراب المعالجة الحسية',
    'non-verbal': 'غير ناطق', 'general': 'احتياجات خاصة عامة',
  },
  'ur-PK': {
    'autism': 'آٹزم (ASD)', 'down-syndrome': 'ڈاؤن سنڈروم', 'speech-delay': 'گفتار / زبان میں تاخیر',
    'adhd': 'اے ڈی ایچ ڈی', 'hearing-impairment': 'سماعت کی کمزوری', 'visual-impairment': 'بینائی کی کمزوری',
    'dyslexia': 'ڈسلیکسیا / سیکھنے کی معذوری', 'cerebral-palsy': 'دماغی فالج / حرکت میں دشواری',
    'intellectual-disability': 'ذہنی معذوری', 'sensory-processing': 'حسی پروسیسنگ ڈس آرڈر',
    'non-verbal': 'غیر لسانی', 'general': 'عمومی خصوصی ضروریات',
  },
};
export function diagnosisLabel(key: string, englishFallback: string, lang: LanguageCode): string {
  return DIAGNOSIS_I18N[lang]?.[key] ?? englishFallback;
}

/**
 * A broad English→Arabic/Urdu word dictionary for the built-in vocabulary
 * (starter board + bulk-build seed lists). Words not listed keep their
 * original text — a caregiver's custom word is never guessed at.
 */
const WORD_AR: Record<string, string> = {
  Coffee: 'قهوة', Tea: 'شاي', 'Hot Chocolate': 'شوكولاتة ساخنة', Soda: 'مشروب غازي', Milkshake: 'ميلك شيك', Smoothie: 'سموذي',
  Lemonade: 'عصير ليمون', 'Water Bottle': 'زجاجة ماء', Burger: 'برغر', Hamburger: 'هامبرغر', Cheeseburger: 'تشيز برغر', 'French Fries': 'بطاطا مقلية',
  'Hot Dog': 'هوت دوغ', Taco: 'تاكو', Nuggets: 'قطع دجاج', 'Chicken Nuggets': 'قطع دجاج', Pasta: 'معكرونة', Noodles: 'نودلز',
  Spaghetti: 'سباغيتي', Meat: 'لحم', Beef: 'لحم بقري', Steak: 'شريحة لحم', Shrimp: 'روبيان', Toast: 'خبز محمص',
  Butter: 'زبدة', Jam: 'مربى', Honey: 'عسل', Pancake: 'بان كيك', Pancakes: 'بان كيك', Waffle: 'وافل',
  Waffles: 'وافل', Cereal: 'حبوب إفطار', Yogurt: 'زبادي', Oatmeal: 'شوفان', Bacon: 'لحم مقدد', Sausage: 'نقانق',
  Snacks: 'وجبات خفيفة', Chips: 'رقائق بطاطس', Popcorn: 'فشار', Pretzel: 'بريتزل', Crackers: 'بسكويت مالح', Nuts: 'مكسرات',
  Candy: 'حلوى', Chocolate: 'شوكولاتة', Donut: 'دونات', Donuts: 'دونات', Cupcake: 'كب كيك', 'Ice Cream': 'آيس كريم',
  Cheesecake: 'تشيز كيك', 'Strawberry Cheesecake': 'تشيز كيك الفراولة', Pie: 'فطيرة', Pudding: 'بودينغ', Ketchup: 'كاتشب', Mustard: 'خردل',
  Mayonnaise: 'مايونيز', Sauce: 'صلصة', Salt: 'ملح', Sugar: 'سكر', Apples: 'تفاح', Bananas: 'موز',
  Blackberry: 'توت أسود', Blueberry: 'توت أزرق', Blueberries: 'توت أزرق', Cherries: 'كرز', Dates: 'تمر', Fig: 'تين',
  Grapes: 'عنب', Guava: 'جوافة', Lime: 'ليمون أخضر', Papaya: 'بابايا', Plum: 'برقوق', Pomegranate: 'رمان',
  Raspberry: 'توت العليق', Strawberries: 'فراولة', Beans: 'فاصولياء', 'Green Beans': 'فاصولياء خضراء', 'Bell Pepper': 'فلفل رومي', Broccoli: 'بروكلي',
  Cabbage: 'ملفوف', Carrots: 'جزر', Cauliflower: 'قرنبيط', Celery: 'كرفس', Chili: 'فلفل حار', Eggplant: 'باذنجان',
  Lettuce: 'خس', Mushrooms: 'فطر', Onions: 'بصل', Peas: 'بازلاء', Potatoes: 'بطاطا', 'Sweet Potato': 'بطاطا حلوة',
  Spinach: 'سبانخ', Tomatoes: 'طماطم', Zucchini: 'كوسة', 'Polar Bear': 'دب قطبي', Kitten: 'قطة صغيرة', Cheetah: 'فهد',
  Bull: 'ثور', Calf: 'عجل', Alligator: 'تمساح', Dinosaur: 'ديناصور', Puppy: 'جرو', Dragonfly: 'يعسوب',
  Flamingo: 'فلامنغو', Toad: 'علجوم', Goose: 'إوزة', 'Guinea Pig': 'خنزير غينيا', Hamster: 'هامستر', Hawk: 'صقر',
  Pony: 'مهر', Jellyfish: 'قنديل البحر', Ladybug: 'دعسوقة', Leopard: 'نمر منقط', Chameleon: 'حرباء', Llama: 'لاما',
  Lobster: 'كركند', Chimpanzee: 'شمبانزي', Mosquito: 'بعوضة', Rat: 'جرذ', Peacock: 'طاووس', Piglet: 'خنزير صغير',
  Pigeon: 'حمامة', Bunny: 'أرنب صغير', 'Sea Lion': 'أسد البحر', Seagull: 'نورس', Lamb: 'حمل', Squid: 'حبار',
  Starfish: 'نجم البحر', Turkey: 'ديك رومي', 'Sea Turtle': 'سلحفاة بحرية', Walrus: 'فظ', Worm: 'دودة', Toy: 'لعبة',
  Toys: 'ألعاب', Doll: 'دمية', Lego: 'ليغو', Puzzle: 'أحجية', Ball: 'كرة', Football: 'كرة قدم',
  Balloon: 'بالون', Bubbles: 'فقاعات', 'Play Dough': 'صلصال', Slime: 'سلايم', 'Teddy Bear': 'دبدوب', 'Action Figure': 'مجسم',
  'Video Game': 'لعبة فيديو', Robot: 'روبوت', Drone: 'طائرة بدون طيار', Kite: 'طائرة ورقية', Trampoline: 'ترامبولين', House: 'منزل',
  Home: 'منزل', Room: 'غرفة', Bedroom: 'غرفة نوم', Bathroom: 'حمام', Kitchen: 'مطبخ', 'Living Room': 'غرفة المعيشة',
  'Dining Room': 'غرفة الطعام', Garden: 'حديقة', Yard: 'فناء', Backyard: 'حديقة خلفية', Garage: 'مرآب', Door: 'باب',
  Window: 'نافذة', Floor: 'أرضية', Ceiling: 'سقف', Wall: 'جدار', Bed: 'سرير', Pillow: 'وسادة',
  Sofa: 'أريكة', Couch: 'كنبة', Lamp: 'مصباح', Light: 'ضوء', Mirror: 'مرآة', Television: 'تلفزيون',
  TV: 'تلفاز', Remote: 'جهاز تحكم', Computer: 'حاسوب', Laptop: 'كمبيوتر محمول', Phone: 'هاتف', Refrigerator: 'ثلاجة',
  Fridge: 'براد', Microwave: 'ميكروويف', Oven: 'فرن', Stove: 'موقد', Sink: 'مغسلة', Bathtub: 'حوض استحمام',
  'Toilet Paper': 'ورق تواليت', Towel: 'منشفة', Soap: 'صابون', Shampoo: 'شامبو', Toothbrush: 'فرشاة أسنان', Toothpaste: 'معجون أسنان',
  Hairbrush: 'فرشاة شعر', Comb: 'مشط', Cup: 'كوب', Glass: 'كأس', Plate: 'صحن', Bowl: 'وعاء',
  Spoon: 'ملعقة', Fork: 'شوكة', Knife: 'سكين', Park: 'حديقة عامة', Beach: 'شاطئ', Pool: 'مسبح',
  'Swimming Pool': 'حمام سباحة', Store: 'متجر', Supermarket: 'سوبرماركت', Mall: 'مركز تسوق', Bakery: 'مخبز', Restaurant: 'مطعم',
  Cafe: 'مقهى', Hospital: 'مستشفى', Clinic: 'عيادة', Pharmacy: 'صيدلية', Library: 'مكتبة', Zoo: 'حديقة حيوان',
  Aquarium: 'متحف مائي', Museum: 'متحف', Cinema: 'سينما', 'Movie Theater': 'سينما', Airport: 'مطار', 'Train Station': 'محطة قطار',
  'Bus Stop': 'موقف باص', Hotel: 'فندق', Bank: 'بنك', 'Post Office': 'مكتب بريد', 'Fire Station': 'محطة إطفاء', 'Police Station': 'مركز شرطة',
  Mosque: 'مسجد', Church: 'كنيسة', Bake: 'أخبز', Cook: 'أطبخ', Boil: 'أغلي', Buy: 'أشتري',
  Build: 'أبني', Draw: 'أرسم', Paint: 'ألون', Color: 'ألون', Cut: 'أقص', Shout: 'أصرخ',
  Laugh: 'أضحك', Smile: 'أبتسم', Cry: 'أبكي', Touch: 'ألمس', Push: 'أدفع', Pull: 'أسحب',
  Throw: 'أرمي', Kick: 'أركل', Ride: 'أركب', Drive: 'أقود', Swim: 'أسبح', Climb: 'أتسلق',
  Jump: 'أقفز', Stand: 'أقف', Wait: 'أنتظر', Give: 'أعطي', Take: 'آخذ', Find: 'أجد',
  Monday: 'الإثنين', Tuesday: 'الثلاثاء', Wednesday: 'الأربعاء', Thursday: 'الخميس', Friday: 'الجمعة', Saturday: 'السبت',
  Sunday: 'الأحد', January: 'يناير', February: 'فبراير', March: 'مارس', April: 'أبريل', May: 'مايو',
  June: 'يونيو', July: 'يوليو', August: 'أغسطس', September: 'سبتمبر', October: 'أكتوبر', November: 'نوفمبر',
  December: 'ديسمبر', Ant: 'نملة', Bear: 'دب', Bee: 'نحلة', Bird: 'طائر', Butterfly: 'فراشة',
  Camel: 'جمل', Cat: 'قطة', Chicken: 'دجاجة', Cow: 'بقرة', Crab: 'سلطعون', Crocodile: 'تمساح',
  Deer: 'غزال', Dog: 'كلب', Dolphin: 'دلفين', Donkey: 'حمار', Duck: 'بطة', Eagle: 'نسر',
  Elephant: 'فيل', Fish: 'سمكة', Fox: 'ثعلب', Frog: 'ضفدع', Giraffe: 'زرافة', Goat: 'ماعز',
  Gorilla: 'غوريلا', Hippo: 'فرس النهر', Horse: 'حصان', Kangaroo: 'كنغر', Koala: 'كوالا', Lion: 'أسد',
  Lizard: 'سحلية', Monkey: 'قرد', Mouse: 'فأر', Octopus: 'أخطبوط', Owl: 'بومة', Panda: 'باندا',
  Parrot: 'ببغاء', Penguin: 'بطريق', Pig: 'خنزير', Rabbit: 'أرنب', Rhino: 'وحيد القرن', Rooster: 'ديك',
  Seal: 'فقمة', Shark: 'قرش', Sheep: 'خروف', Snail: 'حلزون', Snake: 'ثعبان', Spider: 'عنكبوت',
  Squirrel: 'سنجاب', Swan: 'بجعة', Tiger: 'نمر', Turtle: 'سلحفاة', Whale: 'حوت', Wolf: 'ذئب',
  Zebra: 'حمار وحشي', Apple: 'تفاحة', Apricot: 'مشمش', Avocado: 'أفوكادو', Banana: 'موزة', Cherry: 'كرز',
  Coconut: 'جوز الهند', Grape: 'عنب', Kiwi: 'كيوي', Lemon: 'ليمون', Mango: 'مانجو', Melon: 'شمام',
  Orange: 'برتقالة', Peach: 'خوخ', Pear: 'كمثرى', Pineapple: 'أناناس', Strawberry: 'فراولة', Watermelon: 'بطيخ',
  Carrot: 'جزرة', Potato: 'بطاطا', Corn: 'ذرة', Tomato: 'طماطم', Onion: 'بصل', Garlic: 'ثوم',
  Cucumber: 'خيار', Bread: 'خبز', Rice: 'أرز', Egg: 'بيضة', Cheese: 'جبن', Milk: 'حليب',
  Water: 'ماء', Juice: 'عصير', Cake: 'كعكة', Cookie: 'بسكويت', Pizza: 'بيتزا', Soup: 'حساء',
  Chicken_food: 'دجاج', Baseball: 'بيسبول', Basketball: 'كرة السلة', Boxing: 'ملاكمة', Cricket: 'كريكيت', Cycling: 'ركوب الدراجة',
  Golf: 'غولف', Hockey: 'هوكي', Running: 'أركض', Skating: 'تزلج', Skiing: 'تزلج على الجليد', Soccer: 'كرة القدم',
  Surfing: 'ركوب الأمواج', Swimming: 'أسبح', Tennis: 'تنس', Volleyball: 'كرة الطائرة', Backpack: 'حقيبة ظهر', Book: 'كتاب',
  Crayon: 'قلم شمعي', Eraser: 'ممحاة', Folder: 'مجلد', Glue: 'غراء', Marker: 'قلم تحديد', Notebook: 'دفتر',
  Pen: 'قلم', Pencil: 'قلم رصاص', Ruler: 'مسطرة', Scissors: 'مقص', Red: 'أحمر', Orange_c: 'برتقالي',
  Yellow: 'أصفر', Green: 'أخضر', Blue: 'أزرق', Purple: 'بنفسجي', Pink: 'وردي', Brown: 'بني',
  Black: 'أسود', White: 'أبيض', Gray: 'رمادي', Circle: 'دائرة', Square: 'مربع', Triangle: 'مثلث',
  Rectangle: 'مستطيل', Oval: 'بيضاوي', Star: 'نجمة', Heart: 'قلب', Diamond: 'معيّن', Car: 'سيارة',
  Bus: 'حافلة', Train: 'قطار', Airplane: 'طائرة', Boat: 'قارب', Bicycle: 'دراجة', Truck: 'شاحنة',
  Sunny: 'مشمس', Rain: 'مطر', Snow: 'ثلج', Cloudy: 'غائم', Wind: 'رياح', Storm: 'عاصفة',
  Rainbow: 'قوس قزح', Shirt: 'قميص', Pants: 'بنطال', Dress: 'فستان', Shoes: 'حذاء', Hat: 'قبعة',
  Socks: 'جوارب', Jacket: 'سترة', Eye: 'عين', Ear: 'أذن', Nose: 'أنف', Mouth: 'فم',
  Hand: 'يد', Foot: 'قدم', Head: 'رأس', Hair: 'شعر', Brain: 'الدماغ', Lungs: 'الرئتان',
  Liver: 'الكبد', Stomach: 'المعدة', Pancreas: 'البنكرياس', Kidneys: 'الكليتان', Intestines: 'الأمعاء', Bladder: 'المثانة',
  Eyes: 'العينان', Ears: 'الأذنان', Neck: 'الرقبة', Shoulders: 'الكتفان', Chest: 'الصدر', Arms: 'الذراعان',
  Elbows: 'المرفقان', Hands: 'اليدان', Fingers: 'الأصابع', Tummy: 'البطن', Hips: 'الوركان', Legs: 'الساقان',
  Knees: 'الركبتان', Feet: 'القدمان', Toes: 'أصابع القدم', Back: 'الظهر', Torso: 'الجذع', Body: 'الجسم',
  Baby: 'طفل', Brother: 'أخ', Sister: 'أخت', Mom: 'أم', Dad: 'أب', Grandma: 'جدة',
  Grandpa: 'جد', Aunt: 'خالة', Uncle: 'عم', I: 'أنا', You: 'أنت', Want: 'أريد',
  More: 'المزيد', Stop: 'أتوقف', Go: 'أذهب', Like: 'أحب', Help: 'أساعد', Yes: 'نعم',
  No: 'لا', Please: 'من فضلك', 'Thank You': 'شكراً', Look: 'أنظر', Come: 'آتي', Here: 'هنا',
  Where: 'أين', 'I Need Help': 'أحتاج مساعدة', 'I Want': 'أريد', 'I Feel': 'أشعر', 'Can I Have': 'هل يمكنني الحصول على', 'Look At This': 'انظر إلى هذا',
  'More Please': 'المزيد من فضلك', 'Stop Please': 'توقف من فضلك', 'Go To': 'اذهب إلى', 'I Am': 'أنا', 'Where Is': 'أين', 'What Is That': 'ما هذا',
  'I Like': 'أنا أحب', 't Like': 'لا أحب', 'All Done': 'انتهيت', In: 'في', Happy: 'سعيد', Sad: 'حزين',
  Angry: 'غاضب', Proud: 'فخور', Silly: 'سخيف', Frustrated: 'محبط', Loved: 'أحببت', Surprised: 'متفاجئ',
  Confused: 'مرتبك', Shy: 'خجول', Hurt: 'مجروح', Scared: 'خائف', Sick: 'مريض', Tired: 'متعب',
  Excited: 'متحمس', Calm: 'هادئ', Big: 'كبير', Small: 'صغير', Hot: 'ساخن', Cold: 'بارد',
  Fast: 'سريع', Slow: 'بطيء', Good: 'جيد', Bad: 'سيء', Clean: 'أنظف', Dirty: 'متسخ',
  Loud: 'صاخب', Quiet: 'هادئ', Soft: 'ناعم', Hard: 'صعب', Open: 'أفتح', Closed: 'أغلقت',
  Up: 'فوق', Down: 'تحت', Out: 'خارج', Same: 'نفسه', Different: 'مختلف', 'Jump Rope': 'نط الحبل',
  Dancing: 'أرقص', Playground: 'ملعب', Catch: 'أمسك', 'Ride Bike': 'ركوب الدراجة', Gymnastics: 'جمباز', Skateboard: 'لوح تزلج',
  Yoga: 'يوغا', 'Wash Hands': 'غسل اليدين', 'Brush Teeth': 'تنظيف الأسنان', Toilet: 'مرحاض', Shower: 'دش', 'Comb Hair': 'مشط شعرك',
  'Wash Face': 'اغسل وجهك', 'Blow Nose': 'امسح أنفك', 'Put On Clothes': 'البس ملابسك', 'Drink Water': 'اشرب الماء', Sleep: 'أنام', 'Clean Up': 'ترتيب وتنظيف',
  Bandage: 'ضمادة', Sing: 'أغني', Dance: 'أرقص', Guitar: 'جيتار', Piano: 'بيانو', Drums: 'طبول',
  Listen: 'أستمع', Song: 'أغنية', Music: 'موسيقى', Bell: 'جرس', Trumpet: 'بوق', Violin: 'كمان',
  Headphones: 'سماعات', School: 'مدرسة', Teacher: 'معلم', Class: 'صف', Chair: 'كرسي', Desk: 'مكتب',
  Recess: 'استراحة', Crayons: 'ألوان شمعية', Blocks: 'مكعبات', 'Fire Drill': 'تدريب إخلاء الحريق', 'Bulletin Board': 'لوحة إعلانات', 'Pencil Sharpener': 'مبراة أقلام',
  Slide: 'زحليقة', Swing: 'أرجوحة', 'Sensory Table': 'طاولة حسية', Pens: 'أقلام', 'Coloured Pencils': 'أقلام ملونة', Bookshelf: 'رف كتب',
  Cafeteria: 'كافتيريا', 'Main Hall': 'القاعة الرئيسية', Reception: 'استقبال', 'School Store': 'متجر المدرسة', Counting: 'أعد', Learn: 'أتعلم',
  Numbers: 'أرقام', 'Flash Cards': 'بطاقات تعليمية', Crafts: 'حرف يدوية', Hammer: 'مطرقة', Calculator: 'آلة حاسبة', Tape: 'شريط لاصق',
  Sharpener: 'مبراة', Paperclip: 'مشبك ورق', Tablet: 'جهاز لوحي', Paintbrush: 'فرشاة', Clock: 'ساعة', Snack: 'وجبة خفيفة',
  Sandwich: 'شطيرة', Fries: 'بطاطا مقلية', Fruit: 'فاكهة', 'All Day': 'طوال اليوم', Morning: 'الصباح', Bedtime: 'وقت النوم',
  Therapy: 'العلاج', 'Breakfast Time': 'وقت الفطور', 'Play & Learning': 'اللعب والتعلم', 'AAC Speech Session': 'جلسة تواصل بالصور', 'Healthy Lunch': 'غداء صحي', 'Quiet Rest Time': 'وقت راحة هادئ',
  'Sensory Playground': 'ملعب حسي', 'Wake Up & Stretch': 'استيقظ وتمدد', 'Wash Face & Dress': 'اغسل وجهك والبس ملابسك', 'Eat Breakfast': 'تناول الفطور', 'Pack Backpack': 'جهّز الحقيبة المدرسية', 'Family Dinner': 'عشاء عائلي',
  'Warm Bath': 'استحمام دافئ', 'Pajamas & Brush Teeth': 'بيجاما وتنظيف الأسنان', 'Read Storybook': 'اقرأ قصة', 'Lights Out & Sleep': 'أطفئ الأنوار ونم', 'Sensory Warmup': 'إحماء حسي', 'Speech AAC Practice': 'تمرين تواصل بالصور',
  'Fine Motor Skills': 'مهارات حركية دقيقة', 'Star Reward & Free Play': 'مكافأة نجمة ولعب حر', Core: 'أساسي', Food: 'طعام', Feelings: 'مشاعر', People: 'أشخاص',
  Actions: 'أفعال', Places: 'أماكن', Things: 'أشياء', Schools: 'مدرسة', Sentences: 'جمل', Tools: 'أدوات',
  Emotion: 'عاطفة', Attributes: 'صفات', Sports: 'رياضة', Hygiene: 'نظافة', 'Say It For Me': 'قلها لي', 'My Words': 'كلماتي',
  'New Folder': 'مجلد جديد', Blanket: 'بطانية', Clothes: 'ملابس', Outside: 'في الخارج', Hungry: 'جائع', Thirsty: 'عطشان',
  Drinks: 'مشروبات', 'Fast Food': 'وجبات سريعة', Fruits: 'فواكه', Vegetables: 'خضروات', 'Breakfast & Meals': 'فطور ووجبات', 'Snacks & Sweets': 'وجبات خفيفة وحلويات',
  Family: 'العائلة', 'Friends & School': 'الأصدقاء والمدرسة', 'Helpers & Therapists': 'المساعدون والمعالجون', 'Happy & Calm': 'سعيد وهادئ', 'Hard Feelings': 'مشاعر صعبة', 'Body Sensations': 'أحاسيس الجسد',
  'School & Community': 'المدرسة والمجتمع', 'Health & Clinic': 'الصحة والعيادة', 'Fun Outings': 'نزهات ممتعة', 'Toys & Tech': 'ألعاب وتكنولوجيا', 'School Supplies': 'أدوات مدرسية', 'Bathroom & Hygiene': 'حمام ونظافة',
  'Verbs A': 'أفعال A', 'Verbs B': 'أفعال B', 'Verbs C': 'أفعال C', 'Verbs D': 'أفعال D', 'Verbs E': 'أفعال E', 'Verbs F': 'أفعال F',
  'Verbs G': 'أفعال G', 'Verbs H': 'أفعال H', 'Verbs I': 'أفعال I', 'Verbs J': 'أفعال J', 'Verbs K': 'أفعال K', 'Verbs L': 'أفعال L',
  'Verbs M': 'أفعال M', 'Verbs N': 'أفعال N', 'Verbs O': 'أفعال O', 'Verbs P': 'أفعال P', 'Verbs Q': 'أفعال Q', 'Verbs R': 'أفعال R',
  'Verbs S': 'أفعال S', 'Verbs T': 'أفعال T', 'Verbs U': 'أفعال U', 'Verbs V': 'أفعال V', 'Verbs W': 'أفعال W', 'Verbs X': 'أفعال X',
  'Verbs Y': 'أفعال Y', 'Verbs Z': 'أفعال Z', 'Apple Juice': 'عصير تفاح', 'Orange Juice': 'عصير برتقال', 'Fried Chicken': 'دجاج مقلي', 'Onion Rings': 'حلقات بصل',
  'Grilled Cheese': 'جبن مشوي', Classmate: 'زميل دراسة', Principal: 'مدير المدرسة', Aide: 'مساعد', Student: 'طالب', Nurse: 'ممرضة',
  'Speech Therapist': 'أخصائي نطق', OT: 'علاج وظيفي', PT: 'علاج طبيعي', Police: 'شرطة', Firefighter: 'رجل إطفاء', Driver: 'سائق',
  Relaxed: 'مسترخٍ', Energetic: 'نشيط', Safe: 'آمن', Worried: 'قلق', Jealous: 'غيور', Lonely: 'وحيد',
  Bored: 'شاعر بالملل', Itchy: 'حكة', Full: 'شبعان', Dizzy: 'دايخ', 'Doctor Office': 'عيادة الطبيب', 'Dentist Clinic': 'عيادة الأسنان',
  'Therapy Clinic': 'عيادة العلاج', 'Toy Car': 'سيارة لعبة', Paper: 'ورقة', Pajamas: 'بيجاما', Shorts: 'شورت', Boots: 'حذاء طويل',
  Hallway: 'ممر', Street: 'شارع', Ask: 'أسأل', Asked: 'سألت', Asking: 'أسأل', Answer: 'أجيب',
  Answered: 'أجبت', Answering: 'أجيب', Agree: 'أوافق', Agreed: 'وافقت', Agreeing: 'أوافق', Arrive: 'أصل',
  Arrived: 'وصلت', Arriving: 'أصل', Baked: 'خبزت', Baking: 'أخبز', Be: 'أكون', Was: 'كان',
  Been: 'كان', Being: 'كائناً', Bite: 'أعض', Bit: 'عضضت', Bitten: 'معضوض', Biting: 'أعض',
  Blow: 'أنفخ', Blew: 'نفخت', Blown: 'منفوخ', Blowing: 'أنفخ', Break: 'أكسر', Broke: 'كسرت',
  Broken: 'مكسور', Breaking: 'أكسر', Breathe: 'أتنفس', Breathed: 'تنفست', Breathing: 'أتنفس', Bring: 'أحضر',
  Brought: 'أحضرت', Bringing: 'أحضر', Brush: 'أنظف', Brushed: 'نظفت', Brushing: 'أنظف', Built: 'بنيت',
  Building: 'أبني', Bought: 'اشتريت', Buying: 'أشتري', Call: 'أتصل', Called: 'اتصلت', Calling: 'أتصل',
  Carry: 'أحمل', Carried: 'حملت', Carrying: 'أحمل', Caught: 'أمسكت', Catching: 'أمسك', Choose: 'أختار',
  Chose: 'اخترت', Chosen: 'مختار', Choosing: 'أختار', Cleaned: 'نظفت', Cleaning: 'أنظف', Climbed: 'تسلقت',
  Climbing: 'أتسلق', Close: 'أغلق', Closing: 'أغلق', Colored: 'لونت', Coloring: 'ألون', Came: 'أتيت',
  Coming: 'آتي', Cooked: 'طبخت', Cooking: 'أطبخ', Count: 'أعد', Counted: 'عددت', Cried: 'بكيت',
  Crying: 'أبكي', Cutting: 'أقص', Danced: 'رقصت', Do: 'أفعل', Did: 'فعلت', Done: 'منجز',
  Doing: 'أفعل', Drew: 'رسمت', Drawn: 'مرسوم', Drawing: 'أرسم', Dream: 'أحلم', Dreamed: 'حلمت',
  Dreaming: 'أحلم', Drink: 'أشرب', Drank: 'شربت', Drunk: 'شارب', Drinking: 'أشرب', Drove: 'قدت',
  Driven: 'مقود', Driving: 'أقود', Drop: 'أسقط', Dropped: 'أسقطت', Dropping: 'أسقط', Eat: 'آكل',
  Ate: 'أكلت', Eaten: 'مأكول', Eating: 'آكل', Enter: 'أدخل', Entered: 'دخلت', Entering: 'أدخل',
  Exercise: 'أتمرن', Exercised: 'تمرنت', Exercising: 'أتمرن', Explain: 'أشرح', Explained: 'شرحت', Explaining: 'أشرح',
  Fall: 'أسقط', Fell: 'سقطت', Fallen: 'ساقط', Falling: 'أسقط', Feel: 'أشعر', Felt: 'شعرت',
  Feeling: 'أشعر', Fight: 'أقاتل', Fought: 'قاتلت', Fighting: 'أقاتل', Found: 'وجدت', Finding: 'أجد',
  Fix: 'أصلح', Fixed: 'أصلحت', Fixing: 'أصلح', Fly: 'أطير', Flew: 'طرت', Flown: 'طائر',
  Flying: 'أطير', Fold: 'أطوي', Folded: 'طويت', Folding: 'أطوي', Forget: 'أنسى', Forgot: 'نسيت',
  Forgotten: 'منسي', Forgetting: 'أنسى', Get: 'أحصل', Got: 'حصلت', Getting: 'أحصل', Gave: 'أعطيت',
  Given: 'معطى', Giving: 'أعطي', Went: 'ذهبت', Gone: 'ذاهب', Going: 'أذهب', Grow: 'أنمو',
  Grew: 'نموت', Grown: 'نامٍ', Growing: 'أنمو', Have: 'أملك', Had: 'ملكت', Having: 'أملك',
  Hear: 'أسمع', Heard: 'سمعت', Hearing: 'أسمع', Helped: 'ساعدت', Helping: 'أساعد', Hide: 'أختبئ',
  Hid: 'اختبأت', Hidden: 'مخفي', Hiding: 'أختبئ', Hit: 'أضرب', Hitting: 'أضرب', Hold: 'أمسك',
  Held: 'أمسكت', Holding: 'أمسك', Hop: 'أقفز', Hopped: 'قفزت', Hopping: 'أقفز', Hug: 'أعانق',
  Hugged: 'عانقت', Hugging: 'أعانق', Imagine: 'أتخيل', Imagined: 'تخيلت', Imagining: 'أتخيل', Introduce: 'أقدم',
  Introduced: 'قدمت', Introducing: 'أقدم', Invite: 'أدعو', Invited: 'دعوت', Inviting: 'أدعو', Join: 'أنضم',
  Joined: 'انضممت', Joining: 'أنضم', Jog: 'أهرول', Jogged: 'هرولت', Jogging: 'أهرول', Jumped: 'قفزت',
  Jumping: 'أقفز', Keep: 'أحتفظ', Kept: 'احتفظت', Keeping: 'أحتفظ', Kicked: 'ركلت', Kicking: 'أركل',
  Kiss: 'أقبل', Kissed: 'قبلت', Kissing: 'أقبل', Knock: 'أطرق', Knocked: 'طرقت', Knocking: 'أطرق',
  Know: 'أعرف', Knew: 'عرفت', Known: 'معروف', Knowing: 'أعرف', Laughed: 'ضحكت', Laughing: 'أضحك',
  Learned: 'تعلمت', Learning: 'أتعلم', Leave: 'أغادر', Left: 'غادرت', Leaving: 'أغادر', Liked: 'أحببت',
  Liking: 'أحب', Listened: 'استمعت', Listening: 'أستمع', Looked: 'نظرت', Looking: 'أنظر', Love: 'أحب',
  Loving: 'أحب', Make: 'أصنع', Made: 'صنعت', Making: 'أصنع', Meet: 'أقابل', Met: 'قابلت',
  Meeting: 'أقابل', Move: 'أتحرك', Moved: 'تحركت', Moving: 'أتحرك', Need: 'أحتاج', Needed: 'احتجت',
  Needing: 'أحتاج', Nod: 'أومئ', Nodded: 'أومأت', Nodding: 'أومئ', Notice: 'ألاحظ', Noticed: 'لاحظت',
  Noticing: 'ألاحظ', Opened: 'فتحت', Opening: 'أفتح', Order: 'أطلب', Ordered: 'طلبت', Ordering: 'أطلب',
  Painted: 'لونت', Painting: 'ألون', Paste: 'ألصق', Pasted: 'لصقت', Pasting: 'ألصق', Play: 'ألعب',
  Played: 'لعبت', Playing: 'ألعب', Point: 'أشير', Pointed: 'أشرت', Pointing: 'أشير', Pulled: 'سحبت',
  Pulling: 'أسحب', Pushed: 'دفعت', Pushing: 'أدفع', Put: 'أضع', Putting: 'أضع', Quit: 'أتوقف',
  Quitting: 'أتوقف', Question: 'أسأل', Questioned: 'سألت', Questioning: 'أسأل', Read: 'أقرأ', Reading: 'أقرأ',
  Rest: 'أستريح', Rested: 'استرحت', Resting: 'أستريح', Rode: 'ركبت', Ridden: 'راكب', Riding: 'أركب',
  Ring: 'أرن', Rang: 'رننت', Rung: 'ران', Ringing: 'أرن', Run: 'أركض', Ran: 'ركضت',
  Say: 'أقول', Said: 'قلت', Saying: 'أقول', See: 'أرى', Saw: 'رأيت', Seen: 'مرئي',
  Seeing: 'أرى', Share: 'أشارك', Shared: 'شاركت', Sharing: 'أشارك', Show: 'أعرض', Showed: 'عرضت',
  Shown: 'معروض', Showing: 'أعرض', Sang: 'غنيت', Sung: 'مغنى', Singing: 'أغني', Sit: 'أجلس',
  Sat: 'جلست', Sitting: 'أجلس', Slept: 'نمت', Sleeping: 'أنام', Smell: 'أشم', Smelled: 'شممت',
  Smelling: 'أشم', Smiled: 'ابتسمت', Smiling: 'أبتسم', Speak: 'أتكلم', Spoke: 'تكلمت', Spoken: 'متكلم',
  Speaking: 'أتكلم', Spell: 'أتهجى', Spelled: 'تهجيت', Spelling: 'أتهجى', Stood: 'وقفت', Standing: 'أقف',
  Start: 'أبدأ', Stopped: 'توقفت', Stopping: 'أتوقف', Study: 'أدرس', Studied: 'درست', Studying: 'أدرس',
  Swam: 'سبحت', Swum: 'سابح', Took: 'أخذت', Taken: 'مأخوذ', Taking: 'آخذ', Talk: 'أتحدث',
  Talked: 'تحدثت', Talking: 'أتحدث', Taste: 'أتذوق', Tasted: 'تذوقت', Tasting: 'أتذوق', Teach: 'أعلّم',
  Taught: 'علّمت', Teaching: 'أعلّم', Tell: 'أخبر', Told: 'أخبرت', Telling: 'أخبر', Think: 'أفكر',
  Thought: 'فكرت', Thinking: 'أفكر', Threw: 'رميت', Thrown: 'مرمي', Throwing: 'أرمي', Touched: 'لمست',
  Touching: 'ألمس', Try: 'أحاول', Tried: 'حاولت', Trying: 'أحاول', Turn: 'ألتف', Turned: 'التفتت',
  Turning: 'ألتف', Understand: 'أفهم', Understood: 'فهمت', Understanding: 'أفهم', Use: 'أستخدم', Used: 'استخدمت',
  Using: 'أستخدم', Visit: 'أزور', Visited: 'زرت', Visiting: 'أزور', View: 'أشاهد', Viewed: 'شاهدت',
  Viewing: 'أشاهد', Waited: 'انتظرت', Waiting: 'أنتظر', Wake: 'أستيقظ', Woke: 'استيقظت', Woken: 'مستيقظ',
  Waking: 'أستيقظ', Walk: 'أمشي', Walked: 'مشيت', Walking: 'أمشي', Wanted: 'أردت', Wanting: 'أريد',
  Wash: 'أغسل', Washed: 'غسلت', Washing: 'أغسل', Watch: 'أشاهد', Watched: 'شاهدت', Watching: 'أشاهد',
  Wear: 'أرتدي', Wore: 'ارتديت', Worn: 'ملبوس', Wearing: 'أرتدي', Win: 'افوز', Won: 'فزت',
  Winning: 'أفوز', Wish: 'أتمنى', Wished: 'تمنيت', Wishing: 'أتمنى', Work: 'أعمل', Worked: 'عملت',
  Working: 'أعمل', Write: 'أكتب', Wrote: 'كتبت', Written: 'مكتوب', Writing: 'أكتب', Yawn: 'أتثاءب',
  Yawned: 'تثاءبت', Yawning: 'أتثاءب', Yell: 'أصرخ', Yelled: 'صرخت', Yelling: 'أصرخ', Zip: 'أغلق السحاب',
  Zipped: 'أغلقت', Zipping: 'أغلق السحاب', Zoom: 'أنطلق', Zoomed: 'انطلقت', Zooming: 'أنطلق', 'I want to eat': 'أريد أن آكل',
  'I want to drink': 'أريد أن أشرب', 'I need the bathroom': 'أحتاج إلى الحمام', 'I am happy': 'أنا سعيد', 'I am sad': 'أنا حزين', 'I am in pain': 'أشعر بألم', 'I want to play': 'أريد أن ألعب',
  'I am sleepy': 'أنا نعسان', 'I need help': 'أحتاج المساعدة', 'I want to go outside': 'أريد أن أخرج', 'I love you': 'أحبك', 'I am hungry': 'أنا جائع', 'I am thirsty': 'أنا عطشان',
  'Thank you very much': 'شكراً جزيلاً', 'Please help me': 'من فضلك ساعدني', 't feel well': 'لا أشعر أنني بخير', 'I want my mom': 'أريد أمي', 'I want my dad': 'أريد أبي', 'Can we go home': 'هل يمكننا الذهاب إلى المنزل',
  'I am scared': 'أنا خائف', am: 'أنا', is: 'هو', are: 'هم', was: 'كان', 'I want': 'أريد',
  'All done': 'انتهيت', 'I need': 'أحتاج', 'I feel': 'أشعر', 'I like': 'أحب', 'Can I have': 'هل يمكنني الحصول على', 'Thank you': 'شكراً',
  to: 'إلى', the: 'الـ', Friend: 'صديق', Me: 'أنا', Doctor: 'طبيب', Cousin: 'ابن العم',
  Pet: 'حيوان أليف', Classroom: 'فصل دراسي', Gym: 'صالة ألعاب', Pepper: 'فلفل', Eggs: 'بيض',
};
const WORD_UR: Record<string, string> = {
  Monday: 'پیر', Tuesday: 'منگل', Wednesday: 'بدھ', Thursday: 'جمعرات', Friday: 'جمعہ', Saturday: 'ہفتہ',
  Sunday: 'اتوار', January: 'جنوری', February: 'فروری', March: 'مارچ', April: 'اپریل', May: 'مئی',
  June: 'جون', July: 'جولائی', August: 'اگست', September: 'ستمبر', October: 'اکتوبر', November: 'نومبر',
  December: 'دسمبر', Cat: 'بلی', Dog: 'کتا', Cow: 'گائے', Horse: 'گھوڑا', Lion: 'شیر',
  Bird: 'پرندہ', Fish: 'مچھلی', Elephant: 'ہاتھی', Apple: 'سیب', Banana: 'کیلا', Orange: 'مالٹا',
  Grape: 'انگور', Mango: 'آم', Bread: 'روٹی', Rice: 'چاول', Milk: 'دودھ', Water: 'پانی',
  Juice: 'جوس', Egg: 'انڈا', Core: 'بنیادی', Food: 'کھانا', Feelings: 'احساسات', People: 'لوگ',
  Actions: 'کام', Places: 'مقامات', Things: 'چیزیں', Red: 'لال', Schools: 'اسکول', Sentences: 'جملے',
  Tools: 'اوزار', Emotion: 'جذبات', Attributes: 'خصوصیات', Sports: 'کھیل', Hygiene: 'صفائی', Music: 'موسیقی',
  'Say It For Me': 'میرے لیے کہو', 'My Words': 'میرے الفاظ', 'New Folder': 'نیا فولڈر', Folder: 'فولڈر', Ball: 'گیند', Toy: 'کھلونا',
  Blanket: 'کمبل', Clothes: 'کپڑے', Cup: 'کپ', Outside: 'باہر', Hungry: 'بھوکا', Thirsty: 'پیاسا',
  Drinks: 'مشروبات', 'Fast Food': 'فاسٹ فوڈ', Fruits: 'پھل', Vegetables: 'سبزیاں', 'Breakfast & Meals': 'ناشتہ اور کھانا', 'Snacks & Sweets': 'ناشتہ اور مٹھائیاں',
  Family: 'خاندان', 'Friends & School': 'دوست اور اسکول', 'Helpers & Therapists': 'مددگار اور معالج', 'Happy & Calm': 'خوش اور پرسکون', 'Hard Feelings': 'مشکل احساسات', 'Body Sensations': 'جسمانی احساسات',
  Home: 'گھر', 'School & Community': 'اسکول اور کمیونٹی', 'Health & Clinic': 'صحت اور کلینک', 'Fun Outings': 'تفریحی مقامات', 'Toys & Tech': 'کھلونے اور ٹیک', 'School Supplies': 'اسکول کا سامان',
  'Bathroom & Hygiene': 'بیت الخلاء اور صفائی', Baseball: 'بیس بال', Basketball: 'باسکٹ بال', Cricket: 'کرکٹ', Cycling: 'سائیکلنگ', Soccer: 'فٹ بال',
  Swimming: 'تیراکی', Tennis: 'ٹینس', Running: 'دوڑ', Hockey: 'ہاکی', Book: 'کتاب', Pen: 'قلم',
  Pencil: 'پنسل', Eraser: 'ربڑ', Ruler: 'رولر', Scissors: 'قینچی', Bag: 'بستہ', Notebook: 'کاپی',
  Yellow: 'پیلا', Green: 'سبز', Blue: 'نیلا', Black: 'کالا', White: 'سفید', Pink: 'گلابی',
  Brown: 'بھورا', Circle: 'دائرہ', Square: 'مربع', Triangle: 'مثلث', Star: 'ستارہ', Heart: 'دل',
  Car: 'گاڑی', Bus: 'بس', Train: 'ریل', Airplane: 'جہاز', Bicycle: 'سائیکل', I: 'میں',
  You: 'آپ', Want: 'چاہتا ہوں', More: 'مزید', Stop: 'رکو', Go: 'جاؤ', Like: 'پسند',
  Help: 'مدد', Yes: 'ہاں', No: 'نہیں', Please: 'براہ کرم', 'Thank You': 'شکریہ', Look: 'دیکھو',
  Come: 'آؤ', Here: 'یہاں', Where: 'کہاں', 'I Need Help': 'مجھے مدد چاہیے', 'I Want': 'میں چاہتا ہوں', 'I Feel': 'مجھے محسوس ہوتا ہے',
  'Can I Have': 'کیا مجھے مل سکتا ہے', 'Look At This': 'یہ دیکھو', 'More Please': 'مزید براہ کرم', 'Stop Please': 'رکو براہ کرم', 'Go To': 'جاؤ', 'I Am': 'میں ہوں',
  'Where Is': 'کہاں ہے', 'What Is That': 'یہ کیا ہے', 'I Like': 'مجھے پسند ہے', 't Like': 'مجھے پسند نہیں', 'All Done': 'ہو گیا', In: 'اندر',
  Happy: 'خوش', Sad: 'اداس', Angry: 'ناراض', Proud: 'فخر', Silly: 'بے وقوف', Frustrated: 'مایوس',
  Loved: 'پیارا', Surprised: 'حیران', Confused: 'الجھن میں', Shy: 'شرمیلا', Hurt: 'تکلیف', Scared: 'ڈرا ہوا',
  Sick: 'بیمار', Tired: 'تھکا ہوا', Excited: 'پرجوش', Calm: 'پرسکون', Big: 'بڑا', Small: 'چھوٹا',
  Hot: 'گرم', Cold: 'ٹھنڈا', Fast: 'تیز', Slow: 'آہستہ', Good: 'اچھا', Bad: 'برا',
  Clean: 'صاف', Dirty: 'گندا', Loud: 'اونچی آواز', Quiet: 'خاموش', Soft: 'نرم', Hard: 'سخت',
  Open: 'کھلا', Closed: 'بند', Up: 'اوپر', Down: 'نیچے', Out: 'باہر', Same: 'ایک جیسا',
  Different: 'مختلف', 'Jump Rope': 'رسی کودنا', Dancing: 'رقص', Playground: 'کھیل کا میدان', Catch: 'پکڑو', 'Ride Bike': 'سائیکل چلانا',
  Gymnastics: 'جمناسٹک', Skateboard: 'اسکیٹ بورڈ', Yoga: 'یوگا', 'Wash Hands': 'ہاتھ دھونا', 'Brush Teeth': 'دانت صاف کرنا', Toilet: 'بیت الخلا',
  Shower: 'شاور', 'Comb Hair': 'بال بنانا', 'Wash Face': 'منہ دھونا', 'Blow Nose': 'ناک صاف کرنا', 'Put On Clothes': 'کپڑے پہننا', 'Drink Water': 'پانی پینا',
  Sleep: 'سونا', 'Clean Up': 'صفائی کرنا', Bandage: 'پٹی', Sing: 'گانا', Dance: 'ناچنا', Guitar: 'گٹار',
  Piano: 'پیانو', Drums: 'ڈرم', Listen: 'سنو', Song: 'گانا', Bell: 'گھنٹی', Trumpet: 'ترہی',
  Violin: 'وائلن', Headphones: 'ہیڈ فون', School: 'اسکول', Teacher: 'استاد', Class: 'کلاس', Chair: 'کرسی',
  Desk: 'میز', Recess: 'وقفہ', Crayons: 'کریون', Blocks: 'بلاکس', 'Fire Drill': 'آگ سے بچاؤ کی مشق', 'Bulletin Board': 'نوٹس بورڈ',
  'Pencil Sharpener': 'پنسل شارپنر', Slide: 'پھسلن', Swing: 'جھولا', 'Sensory Table': 'حسی میز', Pens: 'قلمیں', 'Coloured Pencils': 'رنگین پنسلیں',
  Bookshelf: 'کتابوں کی الماری', Cafeteria: 'کیفے ٹیریا', 'Main Hall': 'مرکزی ہال', Reception: 'رسیپشن', 'School Store': 'اسکول اسٹور', Counting: 'گنتی',
  Learn: 'سیکھنا', Numbers: 'نمبر', 'Flash Cards': 'فلیش کارڈز', Crafts: 'دستکاری', Hammer: 'ہتھوڑا', Calculator: 'کیلکولیٹر',
  Tape: 'ٹیپ', Sharpener: 'شارپنر', Paperclip: 'پیپر کلپ', Tablet: 'ٹیبلٹ', Paintbrush: 'برش', Clock: 'گھڑی',
  Snack: 'ناشتہ', Sandwich: 'سینڈوچ', Fries: 'فرائز', Fruit: 'پھل', 'All Day': 'پورا دن', Morning: 'صبح',
  Bedtime: 'سونے کا وقت', Therapy: 'تھراپی', 'Breakfast Time': 'ناشتے کا وقت', 'Play & Learning': 'کھیل اور سیکھنا', 'AAC Speech Session': 'تصویری بات چیت سیشن', 'Healthy Lunch': 'صحت بخش دوپہر کا کھانا',
  'Quiet Rest Time': 'خاموش آرام کا وقت', 'Sensory Playground': 'حسی کھیل کا میدان', 'Wake Up & Stretch': 'اٹھو اور کھینچو', 'Wash Face & Dress': 'منہ دھوئیں اور کپڑے پہنیں', 'Eat Breakfast': 'ناشتہ کریں', 'Pack Backpack': 'بستہ تیار کریں',
  'Family Dinner': 'خاندانی رات کا کھانا', 'Warm Bath': 'گرم غسل', 'Pajamas & Brush Teeth': 'نائٹ سوٹ اور دانت صاف کرنا', 'Read Storybook': 'کہانی پڑھیں', 'Lights Out & Sleep': 'لائٹ بند کریں اور سو جائیں', 'Sensory Warmup': 'حسی وارم اپ',
  'Speech AAC Practice': 'تصویری بات چیت کی مشق', 'Fine Motor Skills': 'باریک حرکاتی مہارت', 'Star Reward & Free Play': 'ستارہ انعام اور آزاد کھیل', 'I want to eat': 'میں کھانا چاہتا ہوں', 'I want to drink': 'میں پینا چاہتا ہوں', 'I need the bathroom': 'مجھے باتھ روم جانا ہے',
  'I am happy': 'میں خوش ہوں', 'I am sad': 'میں اداس ہوں', 'I am in pain': 'مجھے تکلیف ہو رہی ہے', 'I want to play': 'میں کھیلنا چاہتا ہوں', 'I am sleepy': 'مجھے نیند آ رہی ہے', 'I need help': 'مجھے مدد چاہیے',
  'I want to go outside': 'میں باہر جانا چاہتا ہوں', 'I love you': 'میں آپ سے پیار کرتا ہوں', 'I am hungry': 'مجھے بھوک لگی ہے', 'I am thirsty': 'مجھے پیاس لگی ہے', 'Thank you very much': 'بہت شکریہ', 'Please help me': 'براہ کرم میری مدد کریں',
  't feel well': 'میری طبیعت ٹھیک نہیں ہے', 'I want my mom': 'مجھے اپنی امی چاہیے', 'I want my dad': 'مجھے اپنے ابو چاہیے', 'Can we go home': 'کیا ہم گھر جا سکتے ہیں', 'I am scared': 'میں ڈرا ہوا ہوں', am: 'ہوں',
  is: 'ہے', are: 'ہیں', was: 'تھا', 'I want': 'میں چاہتا ہوں', 'All done': 'ہو گیا', 'I need': 'مجھے چاہیے',
  'I feel': 'مجھے محسوس ہوتا ہے', 'I like': 'مجھے پسند ہے', 'Can I have': 'کیا مجھے مل سکتا ہے', 'Thank you': 'شکریہ', to: 'کو', the: 'دی',
  Purple: 'جامنی', Friend: 'دوست', Me: 'میں', Mom: 'امی', Dad: 'ابو', Brother: 'بھائی',
  Sister: 'بہن', Baby: 'بچہ', Grandma: 'دادی', Grandpa: 'دادا', Aunt: 'خالہ', Uncle: 'چچا',
  Cousin: 'کزن', Pet: 'پالتو جانور', Classmate: 'ہم جماعت', Principal: 'پرنسپل', Aide: 'مددگار', Student: 'طالب علم',
  Doctor: 'ڈاکٹر', Nurse: 'نرس', 'Speech Therapist': 'اسپیچ تھراپسٹ', OT: 'علاج معالجہ', PT: 'فزیوتھراپی', Police: 'پولیس',
  Firefighter: 'فائر فائٹر', Driver: 'ڈرائیور', Relaxed: 'پرسکون', Energetic: 'توانا', Safe: 'محفوظ', Worried: 'فکرمند',
  Jealous: 'حاسد', Lonely: 'تنہا', Bored: 'بور', Itchy: 'کھجلی', Full: 'پیٹ بھرا', Dizzy: 'چکر آنا',
  Bedroom: 'سونے کا کمرہ', 'Living Room': 'بیٹھک', Kitchen: 'باورچی خانہ', Backyard: 'پچھلا صحن', Bed: 'بستر', Couch: 'صوفہ',
  'Dining Room': 'کھانے کا کمرہ', Classroom: 'کلاس روم', Library: 'لائبریری', Gym: 'جم', Park: 'پارک', Hallway: 'راہداری',
  Street: 'سڑک', 'Doctor Office': 'ڈاکٹر کا دفتر', 'Dentist Clinic': 'دانتوں کا کلینک', Hospital: 'ہسپتال', 'Therapy Clinic': 'تھراپی کلینک', Clinic: 'کلینک',
  Pharmacy: 'میڈیکل اسٹور', Store: 'دکان', Supermarket: 'سپر مارکیٹ', Mall: 'شاپنگ مال', Restaurant: 'ریستوران', Zoo: 'چڑیا گھر',
  Beach: 'ساحل', 'Movie Theater': 'سینما', Pool: 'سوئمنگ پول', Phone: 'فون', 'Toy Car': 'کھلونا گاڑی', Doll: 'گڑیا',
  Puzzle: 'پزل', 'Video Game': 'ویڈیو گیم', 'Teddy Bear': 'ٹیڈی بیئر', Backpack: 'بستہ', Crayon: 'کریون', Glue: 'گوند',
  Paper: 'کاغذ', Marker: 'مارکر', Shirt: 'قمیص', Pants: 'پینٹ', Shoes: 'جوتے', Socks: 'جرابیں',
  Jacket: 'جیکٹ', Hat: 'ٹوپی', Pajamas: 'پاجامہ', Dress: 'لباس', Shorts: 'شارٹس', Boots: 'بوٹ',
  Toothbrush: 'ٹوتھ برش', Toothpaste: 'ٹوتھ پیسٹ', Soap: 'صابن', Shampoo: 'شیمپو', Towel: 'تولیہ', Hairbrush: 'کنگھی',
  'Toilet Paper': 'ٹوالیٹ پیپر', 'Apple Juice': 'سیب کا جوس', 'Orange Juice': 'مالٹے کا جوس', 'Hot Chocolate': 'گرم چاکلیٹ', Tea: 'چائے', Soda: 'سودا',
  Smoothie: 'سمودھی', Lemonade: 'سکنجبین', Pizza: 'پیزا', Burger: 'برگر', 'French Fries': 'فرائز', 'Hot Dog': 'ہاٹ ڈاگ',
  'Chicken Nuggets': 'چکن نگٹس', Taco: 'ٹیکو', 'Fried Chicken': 'فرائیڈ چکن', 'Onion Rings': 'پیاز کے حلقے', Strawberry: 'سٹرابیری', Grapes: 'انگور',
  Watermelon: 'تربوز', Peach: 'آڑو', Pineapple: 'انناس', Pear: 'ناشپاتی', Cherries: 'چیری', Carrot: 'گاجر',
  Broccoli: 'بروکولی', Corn: 'مکئی', Potato: 'آلو', Cucumber: 'کھیرا', Tomato: 'ٹماٹر', Peas: 'مٹر',
  Lettuce: 'سلاد پتا', Onion: 'پیاز', Pepper: 'کالی مرچ', Eggs: 'انڈے', Pancakes: 'پین کیکس', Waffles: 'وافلز',
  Cereal: 'دلیہ', Toast: 'ٹوسٹ', Noodles: 'نوڈلز', Pasta: 'پاستا', Soup: 'سوپ', 'Grilled Cheese': 'گرلڈ پنیر',
  Cookie: 'بسکٹ', 'Ice Cream': 'آئس کریم', Cake: 'کیک', Donut: 'ڈونٹ', Chips: 'چپس', Popcorn: 'پاپ کارن',
  Candy: 'ٹافی', Chocolate: 'چاکلیٹ', Cupcake: 'کپ کیک', Pretzel: 'پریٹزل', Break: 'توڑنا',
};

// Normalized Arabic helper to ignore diacritics / alef variations in reverse lookup
export function normalizeArabic(s: string): string {
  return (s || '')
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي');
}

// Normalized lowercase maps for case-insensitive instant lookup
const WORD_AR_NORM: Record<string, string> = {};
const WORD_UR_NORM: Record<string, string> = {};
const WORD_AR_REV_NORM: Record<string, string> = {};
const WORD_UR_REV_NORM: Record<string, string> = {};

function initNormalizedDictionaries() {
  for (const [k, v] of Object.entries(WORD_AR)) {
    const kNorm = k.trim().toLowerCase();
    WORD_AR_NORM[kNorm] = v;
    WORD_AR_REV_NORM[v.trim().toLowerCase()] = k.trim();
    WORD_AR_REV_NORM[normalizeArabic(v)] = k.trim();
  }
  for (const [k, v] of Object.entries(WORD_UR)) {
    const kNorm = k.trim().toLowerCase();
    WORD_UR_NORM[kNorm] = v;
    WORD_UR_REV_NORM[v.trim().toLowerCase()] = k.trim();
  }
  for (const [k, v] of Object.entries(STARTER_WORDS['ar-SA'] ?? {})) {
    const kNorm = k.trim().toLowerCase();
    if (!WORD_AR_NORM[kNorm]) WORD_AR_NORM[kNorm] = v;
    WORD_AR_REV_NORM[v.trim().toLowerCase()] = k.trim();
    WORD_AR_REV_NORM[normalizeArabic(v)] = k.trim();
  }
  for (const [k, v] of Object.entries(STARTER_WORDS['ur-PK'] ?? {})) {
    const kNorm = k.trim().toLowerCase();
    if (!WORD_UR_NORM[kNorm]) WORD_UR_NORM[kNorm] = v;
    WORD_UR_REV_NORM[v.trim().toLowerCase()] = k.trim();
  }
  for (const [k, v] of Object.entries(STARTER_WORDS['ur-PK'] ?? {})) {
    const kNorm = k.trim().toLowerCase();
    if (!WORD_UR_NORM[kNorm]) WORD_UR_NORM[kNorm] = v;
    WORD_UR_REV_NORM[v.trim().toLowerCase()] = k.trim();
  }
}
initNormalizedDictionaries();

// Dynamic Persistent Translation Cache
const DYNAMIC_CACHE_KEY = '@angeltalk_dynamic_translations_v2';
const DYNAMIC_CACHE: Record<string, Record<string, string>> = {
  'ar-SA': {},
  'ur-PK': {},
  'en-US': {},
};

AsyncStorage.getItem(DYNAMIC_CACHE_KEY)
  .then((raw) => {
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed['ar-SA']) Object.assign(DYNAMIC_CACHE['ar-SA'], parsed['ar-SA']);
        if (parsed['ur-PK']) Object.assign(DYNAMIC_CACHE['ur-PK'], parsed['ur-PK']);
        if (parsed['en-US']) Object.assign(DYNAMIC_CACHE['en-US'], parsed['en-US']);
      } catch { }
    }
  })
  .catch(() => { });

function persistDynamicCache() {
  AsyncStorage.setItem(DYNAMIC_CACHE_KEY, JSON.stringify(DYNAMIC_CACHE)).catch(() => { });
}

// Backward-compatible reverse dictionaries
function buildReverse(dict: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [en, local] of Object.entries(dict)) out[local] = en;
  return out;
}
const WORD_AR_REVERSE = buildReverse(WORD_AR);
const WORD_UR_REVERSE = buildReverse(WORD_UR);

const CANONICAL_SHELVES: Record<string, string> = {
  feelings: "Feelings",
  feeling: "Feelings",
  emotion: "Feelings",
  emotions: "Feelings",
  feelings2: "Feelings",
  "مشاعر": "Feelings",
  "احساسات": "Feelings",
  "جذبات": "Feelings",
  "عاطفة": "Feelings",
  people: "People",
  person: "People",
  "أشخاص": "People",
  "لوگ": "People",
  actions: "Actions",
  action: "Actions",
  verbs: "Actions",
  verb: "Actions",
  "أفعال": "Actions",
  "کام": "Actions",
  food: "Food",
  foods: "Food",
  "طعام": "Food",
  "کھانا": "Food",
  places: "Places",
  place: "Places",
  "أماكن": "Places",
  "مقامات": "Places",
  things: "Things",
  thing: "Things",
  "أشياء": "Things",
  "چیزیں": "Things",
  core: "Core",
  "أساسي": "Core",
  "بنیادی": "Core",
  red: "Red",
  "أحمر": "Red",
  "لال": "Red",
  "say it for me": "Say It For Me",
  "قلها لي": "Say It For Me",
  "میرے لیے کہو": "Say It For Me",
  schools: "Schools",
  school: "Schools",
  "مدرسة": "Schools",
  "اسکول": "Schools",
  sports: "Sports",
  sport: "Sports",
  "رياضة": "Sports",
  "کھیل": "Sports",
  hygiene: "Hygiene",
  "نظافة": "Hygiene",
  "صفائی": "Hygiene",
  music: "Music",
  "موسيقى": "Music",
  "موسیقی": "Music",
};

/**
 * Recover the canonical English form of a word, whatever language it's
 * currently displayed in (a no-op if it's already English or unknown).
 */
export function canonicalWordEn(label: string): string {
  const clean = (label || '').trim();
  if (!clean) return '';
  const lower = clean.toLowerCase();
  const normAr = normalizeArabic(clean);


  if (CANONICAL_SHELVES[lower]) return CANONICAL_SHELVES[lower];
  if (CANONICAL_SHELVES[normAr]) return CANONICAL_SHELVES[normAr];
  // If no Arabic/Urdu unicode characters, it is already English/Latin
  if (!/[\u0600-\u06FF]/.test(clean)) {
    return clean;
  }


  return (
    WORD_AR_REV_NORM[normAr] ??
    WORD_AR_REV_NORM[lower] ??
    WORD_UR_REV_NORM[lower] ??
    DYNAMIC_CACHE['en-US']?.[lower] ??
    WORD_AR_REVERSE[clean] ??
    WORD_UR_REVERSE[clean] ??
    clean
  );
}

/**
 * Synchronous dictionary lookup. Returns translated word in current language,
 * or recovers original English word if lang is 'en-US'.
 */
export function wordLabel(label: string, lang: LanguageCode): string {
  const clean = (label || '').trim();
  if (!clean) return '';
  if (lang === 'en-US') {
    return canonicalWordEn(clean);
  }

  const en = canonicalWordEn(clean);
  const enLower = en.toLowerCase();

  if (lang === 'ar-SA') {
    if (WORD_AR_NORM[enLower]) return WORD_AR_NORM[enLower];
    if (DYNAMIC_CACHE['ar-SA']?.[enLower]) return DYNAMIC_CACHE['ar-SA'][enLower];
    const starter = starterLabel(en, lang);
    if (starter && starter !== en) return starter;
    if (/[\u0600-\u06FF]/.test(clean)) return clean;
    return en;
  }

  if (lang === 'ur-PK') {
    if (WORD_UR_NORM[enLower]) return WORD_UR_NORM[enLower];
    if (DYNAMIC_CACHE['ur-PK']?.[enLower]) return DYNAMIC_CACHE['ur-PK'][enLower];
    const starter = starterLabel(en, lang);
    if (starter && starter !== en) return starter;
    if (/[\u0600-\u06FF]/.test(clean)) return clean;
    return en;
  }

  return en;
}

/**
 * Asynchronously translates any word or phrase into the target language.
 * Checks dictionary and cache first. If missing, dynamically translates
 * via online service, caches both forward & reverse, and persists to AsyncStorage.
 */
export async function translateDynamic(text: string, targetLang: LanguageCode): Promise<string> {
  const clean = (text || '').trim();
  if (!clean) return clean;

  if (targetLang === 'en-US') {
    return canonicalWordEn(clean);
  }

  // 1. Try synchronous dictionary & cache lookup first
  const syncMatch = wordLabel(clean, targetLang);
  if (syncMatch && syncMatch.toLowerCase() !== clean.toLowerCase()) {
    return syncMatch;
  }

  const enLower = clean.toLowerCase();
  if (DYNAMIC_CACHE[targetLang]?.[enLower]) {
    return DYNAMIC_CACHE[targetLang][enLower];
  }

  // If already in Arabic script, keep it
  if (['ar-SA', 'ur-PK'].includes(targetLang) && /[\u0600-\u06FF]/.test(clean)) {
    return clean;
  }

  // 2. Fetch from Google Translate API
  const tl = targetLang === 'ar-SA' ? 'ar' : targetLang === 'ur-PK' ? 'ur' : 'en';
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${tl}&dt=t&q=${encodeURIComponent(clean)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const translated = data?.[0]?.[0]?.[0];
      if (translated && typeof translated === 'string') {
        const transTrim = translated.trim();
        if (!DYNAMIC_CACHE[targetLang]) DYNAMIC_CACHE[targetLang] = {};
        DYNAMIC_CACHE[targetLang][enLower] = transTrim;
        // Save reverse as well for seamless switching back to English
        if (!DYNAMIC_CACHE['en-US']) DYNAMIC_CACHE['en-US'] = {};
        DYNAMIC_CACHE['en-US'][transTrim.toLowerCase()] = clean;
        persistDynamicCache();
        return transTrim;
      }
    }
  } catch (e) {
    // Network unavailable or offline: fallback to clean
  }

  return clean;
}
