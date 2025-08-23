# 📋 LinearTime Manual Testing Checklist

**Current Test Environment**: http://localhost:3000  
**Components Under Test**: LinearCalendarHorizontal, EventModal, FloatingToolbar  
**Last Updated**: August 23, 2025

## 🎯 Core Functionality Tests

### ✅ **1. EventModal Integration**
Test the re-enabled EventModal functionality:

- [ ] **Day Click → Create Event**
  - Click any empty day in the calendar
  - Verify EventModal opens for event creation
  - Test on both full-year grid and month views
  - Verify date is pre-populated correctly

- [ ] **Event Double-Click → Edit Event**
  - Double-click any existing event
  - Verify EventModal opens in edit mode
  - Verify all event data is populated correctly

- [ ] **Event Save Functionality**
  - Create a new event via modal
  - Edit an existing event via modal
  - Verify changes persist after save
  - Verify modal closes after successful save

- [ ] **Event Delete Functionality**
  - Use delete button in EventModal
  - Verify confirmation dialog (if present)
  - Verify event is removed from calendar

### ✅ **2. FloatingToolbar Operations**
Test the floating toolbar that appears when clicking events:

- [ ] **Toolbar Visibility**
  - Click any event in the calendar
  - Verify FloatingToolbar appears
  - Verify toolbar is positioned correctly
  - Verify toolbar appears above other elements (z-index)

- [ ] **Toolbar Positioning**
  - Click events in different calendar positions
  - Test events near screen edges
  - Test events at different zoom levels
  - Verify toolbar doesn't overlap calendar elements

- [ ] **Toolbar Functions**
  - Test "Edit Event" button → opens EventModal
  - Test "Delete" button → removes event
  - Test "Duplicate" button → creates copy
  - Test "Close" button → hides toolbar

### ✅ **3. Unified Click Behavior**
Test the consistent event handling:

- [ ] **Date Selection**
  - Click days in full-year grid view
  - Click days in month view
  - Verify both trigger `onDateSelect` callback
  - Verify consistent behavior between views

- [ ] **Event Prevention**
  - Verify clicks don't cause page scrolling
  - Verify no unwanted browser default behaviors
  - Test rapid clicking doesn't cause issues

## 🖥️ **Cross-Device & Browser Testing**

### **Desktop Testing**
- [ ] **Chrome** (latest)
- [ ] **Firefox** (latest) 
- [ ] **Safari** (latest)
- [ ] **Edge** (latest)

### **Mobile Testing**
- [ ] **iOS Safari** (phone)
- [ ] **iOS Safari** (tablet)
- [ ] **Chrome Android** (phone)
- [ ] **Chrome Android** (tablet)

### **Screen Sizes**
- [ ] **Small Mobile** (320px - 480px)
- [ ] **Large Mobile** (481px - 768px)
- [ ] **Tablet** (769px - 1024px)
- [ ] **Desktop** (1025px+)
- [ ] **Large Desktop** (1440px+)

## 🔍 **Edge Case Testing**

### **Viewport Edge Cases**
- [ ] Events near top viewport edge
- [ ] Events near bottom viewport edge
- [ ] Events near left viewport edge
- [ ] Events near right viewport edge
- [ ] Events in corners of viewport

### **Interaction Edge Cases**
- [ ] Multiple rapid event clicks
- [ ] Clicking events while modal is open
- [ ] Clicking days while toolbar is open
- [ ] Keyboard navigation while modal is open

### **Zoom Level Testing**
- [ ] Full Year zoom level
- [ ] Year zoom level
- [ ] Quarter zoom level
- [ ] Month zoom level
- [ ] Week zoom level (if available)

### **Event Density Testing**
- [ ] Calendar with no events
- [ ] Calendar with few events (5-10)
- [ ] Calendar with many events (50+)
- [ ] Calendar with overlapping events
- [ ] Events with long titles
- [ ] Events with special characters

## 🚀 **Performance Testing**

### **Response Time**
- [ ] Modal opens in <200ms
- [ ] Toolbar appears in <100ms
- [ ] Event saves in <300ms
- [ ] Calendar renders in <500ms

### **Memory Usage**
- [ ] No memory leaks during extended use
- [ ] Modal cleanup after close
- [ ] Event listener cleanup
- [ ] Component unmounting properly

## 🎨 **Visual & Accessibility Testing**

### **Visual Consistency**
- [ ] Toolbar styling matches design system
- [ ] Modal styling matches design system
- [ ] Hover states work correctly
- [ ] Focus states are visible
- [ ] Loading states display properly

### **Accessibility**
- [ ] Keyboard navigation to modals
- [ ] Screen reader announcements
- [ ] Focus management in modals
- [ ] Color contrast compliance
- [ ] ARIA labels present and correct

## 🛠️ **Developer Testing**

### **Console Output**
- [ ] No JavaScript errors in console
- [ ] No React warnings in console
- [ ] No TypeScript errors during build
- [ ] Proper logging for debugging

### **Network Requests**
- [ ] No unnecessary API calls
- [ ] Proper error handling for failed requests
- [ ] Loading states during async operations

## ✅ **Test Results Documentation**

### **Pass Criteria**
- All core functionality works as expected
- No visual regressions
- Performance targets met
- No accessibility violations
- Cross-browser compatibility confirmed

### **Bug Report Template**
```
**Bug Title**: [Descriptive title]
**Steps to Reproduce**: 
1. 
2. 
3. 

**Expected Result**: 
**Actual Result**: 
**Browser/Device**: 
**Screenshot**: [if applicable]
**Priority**: High/Medium/Low
```

## 🔄 **Regression Testing**

### **Before Each Release**
- [ ] Run full checklist
- [ ] Test on primary browsers
- [ ] Verify no existing functionality broken
- [ ] Performance benchmarks maintained

### **After Bug Fixes**
- [ ] Re-test specific bug scenario
- [ ] Test related functionality
- [ ] Smoke test core features

---

## 📊 **Current Status**

**EventModal**: ✅ Re-enabled and integrated  
**FloatingToolbar**: ✅ Positioning and visibility verified  
**Click Handlers**: ✅ Unified behavior implemented  
**TypeScript**: ✅ Clean compilation  
**Build**: ✅ Successfully compiling  

**Next Steps**: Run comprehensive manual testing with this checklist

---

*Testing Environment: http://localhost:3000*  
*Component Status: Ready for manual verification*