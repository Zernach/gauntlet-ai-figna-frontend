- Do not write tests for anything.
- Use existing components where possible.
- Avoid using .map() in render functions, and instead, for performance purposes,
  always default to using a FlatList with renderItem wrapped in useCallback.
  Focus on performance. To ensure the correct packages are used, instead of
  using FlatList/ScrollView directly, use the CustomList component and pass in
  the appropriate props.
- Use the CustomText component for Text.
- Use the CustomButton component for buttons.
- Use the CustomTextInput component for TextInput.
- Use the CustomImage component for Image or ImageBackground.
- Add any new colors to the colors file instead of hardcoding them, and pull
  from existing colors where possible.
- When creating a new component, create a new folder in the components directory
  with the name of the component, and add an index.tsx file for the component
  code. Use Stylesheet.create for styling. Do not use "export default" for
  components (unless it is a screen for expo-router).
- Prefer StyleSheet.flatten instead of StyleSheet.compose
- If window dimensions are needed, import the existing useResponsive custom hook
- In most situations, prefer react-native-reanimated over the built-in Animated
  from react-native
- If you create any helper utility function scripts, then create a new directory
  inside the `scripts` directory with the name of the utility, and add an
  index.ts file for the code.
