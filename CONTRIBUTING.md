# Contributing

Contributions are always welcome, no matter how large or small!

We want this community to be friendly and respectful to each other. Please follow it in all your interactions with the project. Before contributing, please read the [code of conduct](./CODE_OF_CONDUCT.md).

## Development workflow

This project is a monorepo managed using [Yarn workspaces](https://yarnpkg.com/features/workspaces). It contains the following packages:

- The library package in the root directory.
- An example app in the `example/` directory.

To get started with the project, run `yarn` in the root directory to install the required dependencies for each package:

```sh
yarn
```

> Since the project relies on Yarn workspaces, you cannot use [`npm`](https://github.com/npm/cli) for development.



### Example Apps

We have two example apps in the `example/` directory:

-   **`bare`**: A standard React Native app. Use this example for testing changes to the native modules (Android/iOS).
-   **`expo`**: An Expo app. Use this example for testing UI, cross-platform behavior, and web compatibility.

You can run the example apps using the following commands from the root directory:

To start the packager:

```sh
yarn example:expo start
```

To run the example app on Android:

```sh
yarn example:expo android
```

To run the example app on iOS:

```sh
yarn example:expo ios
```

To run the example app on Web (for Expo):

```sh
yarn example:expo web
```

To confirm that the app is running with the new architecture, you can check the Metro logs for a message like this:

```sh
Running "VideoToolkitExample" with {"fabric":true,"initialProps":{"concurrentRoot":true},"rootTag":1}
```

Note the `"fabric":true` and `"concurrentRoot":true` properties.

### Native Code

This project contains native modules for Android (Kotlin) and iOS (Objective-C). If you make changes to the native code, you will need to run the `codegen` script to update the generated code:

```sh
yarn codegen
```

After running `codegen`, you will need to rebuild the example app to see your changes.

### Linting and tests

Make sure your code passes TypeScript and ESLint. Run the following to verify:

```sh
yarn typecheck
yarn lint
```

To fix formatting errors, run the following:

```sh
yarn lint --fix
```

Remember to add tests for your change if possible. Run the unit tests by:

```sh
yarn test
```

### Commit message convention

We follow the [conventional commits specification](https://www.conventionalcommits.org/en) for our commit messages:

- `fix`: bug fixes, e.g. fix crash due to deprecated method.
- `feat`: new features, e.g. add new method to the module.
- `refactor`: code refactor, e.g. migrate from class components to hooks.
- `docs`: changes into documentation, e.g. add usage example for the module..
- `test`: adding or updating tests, e.g. add integration tests using detox.
- `chore`: tooling changes, e.g. change CI config.

Our pre-commit hooks verify that your commit message matches this format when committing.

### Publishing to npm

We use [release-it](https://github.com/release-it/release-it) to make it easier to publish new versions. It handles common tasks like bumping version based on semver, creating tags and releases etc.

To publish new versions, run the following:

```sh
yarn release
```

### Scripts

The `package.json` file contains various scripts for common tasks:

- `yarn`: setup project by installing dependencies.
- `yarn typecheck`: type-check files with TypeScript.
- `yarn lint`: lint files with ESLint.
- `yarn test`: run unit tests with Jest.
- `yarn example:expo start`: start the Metro server for the example app.
- `yarn example:expo android`: run the example app on Android.
- `yarn example:expo ios`: run the example app on iOS.

### Sending a pull request

> **Working on your first pull request?** You can learn how from this _free_ series: [How to Contribute to an Open Source Project on GitHub](https://app.egghead.io/playlists/how-to-contribute-to-an-open-source-project-on-github).

When you're sending a pull request:

- Prefer small pull requests focused on one change.
- Verify that linters and tests are passing.
- Review the documentation to make sure it looks good.
- Follow the pull request template when opening a pull request.
- For pull requests that change the API or implementation, discuss with maintainers first by opening an issue.


## Documentation Style Guide

This guide defines the **rules and structure** for writing documentation in this project.
Follow these strictly so all docs stay **consistent, easy to read, and developer-friendly**.


### 1. File Naming

- Use **lowercase-with-dashes** for doc file names.
  Example:
  - `use-playback.md`
  - `video-player.md`

### 2. Frontmatter

Every doc must start with a YAML frontmatter block:

```md
---
sidebar_label: ComponentOrHookName
sidebar_position: <number>
---
```

*   `sidebar_label` → Match the component/hook name exactly.
*   `sidebar_position` → Controls ordering in the sidebar.

### 3. Heading Order

Always follow this heading order:

1.  `# Title` → The name of the component/hook/module.
2.  `## Subtitle` → for example "useSettings()" or "PlayButton".
3.  `### Usage` → First thing shown should be how to use it.
4.  `### Props` (for components) **OR** `## Returns` (for hooks).
5.  `### Example` → At least one full usage example.
6.  `### Notes` (optional) → Caveats, edge cases, or advanced tips.

### 4. Usage Section

*   Always provide a **minimal code snippet** showing import + usage.
*   Use **TypeScript syntax highlighting**.
*   Keep it runnable (no pseudo code unless necessary).

Example:

```tsx
import { PlayButton } from 'react-native-video-toolkit';

export const Player = () => {
  return <PlayButton size={32} color="white" />;
};
```

### 5. Props / Returns Tables

*   Always use a **Markdown table**.
*   Columns: **Property | Type | Default | Description**
*   Order: required props first, optional props later.
*   If hook → use **Returns** table instead of Props.

Example (Component Props):

| Prop      | Type         | Default    | Description                  |
| --------- | ------------ | ---------- | ---------------------------- |
| `size`    | `number`     | `24`       | Size of the icon in pixels.  |
| `color`   | `string`     | `"black"`  | Icon color.                  |
| `onPress` | `() => void` | `required` | Callback fired when pressed. |

Example (Hook Returns):

| Value             | Type             | Description                       |
| ----------------- | ---------------- | --------------------------------- |
| `isPlaying`       | `boolean`        | Current playback state.           |
| `togglePlayPause` | `() => void`     | Toggles playback.                 |
| `seek`            | `(time: number)` | Jumps to a given time in seconds. |

### 6. Example Section

*   Must include **at least one full example**.
*   Prefer a **realistic UI snippet** over barebones.
*   Use React functional components with hooks.

Example:

```tsx
import { VideoPlayer } from 'react-native-video-toolkit';

export const Example = () => (
  <VideoPlayer source={{ uri: "https://example.com/video.mp4" }}>
    <VideoPlayer.Controls>
      <VideoPlayer.PlayButton />
      <VideoPlayer.ProgressBar />
    </VideoPlayer.Controls>
  </VideoPlayer>
);
```

### 7. General Rules

*   Always use **TypeScript type annotations** in examples.
*   Keep **props descriptions human-readable**, not just type hints.
*   Never leave props undocumented.
*   Prefer **short, active voice sentences**.
*   Keep code examples **copy-paste runnable**.

## JSDoc/TypeDoc Standards

This section defines **strict rules** for writing JSDoc comments in TypeScript/TSX files.
Follow these exactly to maintain **consistency** across the entire codebase.

### 1. General JSDoc Format

**Always use this exact structure:**

```typescript
/**
 * Brief one-line description of what this does.
 *
 * @param {Type} paramName - Brief description of the parameter.
 * @returns {Type} Brief description of what is returned.
 */
```

**DO:**

-   **One line summary** followed by **empty line**
-   **Short, clear descriptions** (no unnecessary details)
-   **Consistent parameter formatting**: `@param {Type} paramName - Description.`
-   **Always end descriptions with a period**
-   **Use active voice**: "Toggles fullscreen" not "This function toggles fullscreen"

**DON'T:**

-   Long, verbose descriptions that repeat the obvious
-   Multiple paragraphs unless absolutely necessary
-   Redundant type information (TypeScript handles this)
-   Passive voice or wordy explanations

### 2. React Components

**Standard format for components:**

```tsx
export interface ComponentProps {
  size?: number;
  color?: string;
  onPress?: () => void;
}

/**
 * A button that toggles fullscreen mode.
 *
 * @param {ComponentProps} props - The props for the component.
 * @returns {React.ReactElement} The fullscreen button component.
 */
export const Component = ({ size, color, onPress }: ComponentProps): React.ReactElement => {
  // Implementation
};
```

**Key Rules:**

-   Props interface **always above** the component
-   JSDoc **directly above** the component export
-   Generic props parameter: `@param {ComponentProps} props - The props for the component.`
-   Return type: `@returns {React.ReactElement} The [component name] component.`

### 3. Custom Hooks

**Standard format for hooks:**

```typescript
/**
 * A hook for controlling fullscreen mode.
 *
 * @returns An object with the following properties:
 * - `fullscreen`: A boolean indicating whether the video is in fullscreen mode.
 * - `toggleFullscreen`: A function to toggle fullscreen mode.
 * - `fullscreenTapGesture`: A gesture object for handling taps.
 */
export const useHookName = () => {
  // Implementation
};
```

**Key Rules:**

-   Start with: "A hook for [purpose]"
-   Use **bullet points** for return object properties
-   **No `<!-- Import failed: returns - ENOENT: no such file or directory, access 'C:\Users\Durgesh\OneDrive\Documents\Desktop\react-native-video-toolkit\returns' -->` tag** - just describe the returned object
-   Keep property descriptions **short and action-oriented**

### 4. Utility Functions

**Standard format for utilities:**

```typescript
/**
 * Calculates the optimal video dimensions for the given screen size.
 *
 * @param {number} screenWidth - The width of the screen in pixels.
 * @param {number} screenHeight - The height of the screen in pixels.
 * @param {number} aspectRatio - The video aspect ratio.
 * @returns {Dimensions} The calculated optimal dimensions.
 */
export const calculateDimensions = (
  screenWidth: number,
  screenHeight: number,
  aspectRatio: number
): Dimensions => {
  // Implementation
};
```

**Key Rules:**

-   **Active voice** for function purpose
-   **Each parameter** gets its own `@param` line
-   **Clear return description** with `@returns`

### 5. Internal Functions/Methods

**Simplified format for internal functions:**

```typescript
/**
 * Handles orientation locking when entering fullscreen.
 */
const handleEnterFullscreen = useCallback(async () => {
  // Implementation
}, []);

/**
 * Updates the player controls visibility state.
 */
const updateControlsVisibility = () => {
  // Implementation
};
```

**Key Rules:**

-   **One line only** for internal functions
-   **No `<!-- Import failed: param/@returns - ENOENT: no such file or directory, access 'C:\Users\Durgesh\OneDrive\Documents\Desktop\react-native-video-toolkit\param\@returns' -->`** unless the function is complex
-   **Start with action verb**: "Handles", "Updates", "Calculates", etc.

### 6. Enforcement Rules

1.  **All exported functions/components/hooks** MUST have JSDoc
2.  **Internal functions** should have JSDoc if they're complex
3.  **Interfaces/Types** do NOT need JSDoc (TypeScript is self-documenting)
4.  **Use ESLint JSDoc rules** to enforce these standards
5.  **Code reviews** must check JSDoc compliance
