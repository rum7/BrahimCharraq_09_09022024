/**
 * @jest-environment jsdom
 */
import { fireEvent, screen, waitFor } from "@testing-library/dom"
import { toHaveClass } from "@testing-library/jest-dom"
import userEvent from '@testing-library/user-event'
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import BillsUI from "../views/BillsUI.js"

import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store"

import { ROUTES, ROUTES_PATH } from "../constants/routes.js"
import router from "../app/Router.js"

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then the new bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))

      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)

      const mailIcon = await waitFor(() => screen.getByTestId('icon-mail'))
      expect(mailIcon).toHaveClass('active-icon')
    })
    
    test("Then all the fields of the forme should've been loaded", () => {
      document.body.innerHTML = NewBillUI()
      expect(screen.getByTestId("form-new-bill")).toBeTruthy()
      expect(screen.getByTestId("expense-type")).toBeTruthy()
      expect(screen.getByTestId("expense-name")).toBeTruthy()
      expect(screen.getByTestId("datepicker")).toBeTruthy()
      expect(screen.getByTestId("amount")).toBeTruthy()
      expect(screen.getByTestId("vat")).toBeTruthy()
      expect(screen.getByTestId("pct")).toBeTruthy()
      expect(screen.getByTestId("commentary")).toBeTruthy()
      expect(screen.getByTestId("file")).toBeTruthy()
      expect(screen.getByRole("button")).toBeTruthy()
    })

    describe('When I upload a file', () => {   
      beforeEach(() => { jest.spyOn(window, 'alert').mockImplementation(() => {}) })
      afterEach(() => { window.alert.mockClear() })

      test('Then I should get the filename from the input', () => {
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
        
        const onNavigate = (pathname) => { document.body.innerHTML = pathname }
        const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })
        const handleChangeFile = jest.fn(newBill.handleChangeFile)
        
        document.body.innerHTML = NewBillUI()
        const file = new File(['mybill'], 'mybillPicture.png', { type: 'image/png' })
        const fileInput = screen.getByTestId('file')
        fileInput.addEventListener('change', handleChangeFile)
        userEvent.upload(fileInput, file)
        expect(handleChangeFile).toHaveBeenCalled()
        expect(fileInput.files).toHaveLength(1)
        const fileName = fileInput.files[0].name
        expect(fileName).toBe('mybillPicture.png')

        expect(window.alert).not.toHaveBeenCalled()
      })

      test('Then I should get an alert if the uploaded file is not a jpg, jpeg or png', () => {
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
        
        const onNavigate = (pathname) => { document.body.innerHTML = pathname }
        const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })
        const handleChangeFile = jest.fn(newBill.handleChangeFile)
                
        document.body.innerHTML = NewBillUI()
        const file = new File(['mybill'], 'mybillPicture.gif', { type: 'image/gif' })
        const fileInput = screen.getByTestId('file')
        fileInput.addEventListener('change', handleChangeFile)
        userEvent.upload(fileInput, file)
        expect(handleChangeFile).toHaveBeenCalled()
        const fileName = fileInput.files[0].name
        expect(fileName).toBe('mybillPicture.gif')

        expect(window.alert).toHaveBeenCalled()
      })

      test('Then it should handle error during creation of the new bill ', async () => {
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
        
        const onNavigate = (pathname) => { document.body.innerHTML = pathname }
        const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })
        const handleChangeFile = jest.fn(newBill.handleChangeFile)
                
        newBill.store = {
          bills: jest.fn().mockReturnValue({
            create: jest.fn().mockRejectedValue(new Error('Erreur'))
          })
        }
    
        jest.spyOn(console, 'error').mockImplementation(() => {})
    
        document.body.innerHTML = NewBillUI()
        const file = new File(['mybill'], 'mybillPicture.jpg', { type: 'image/jpg' })
        const fileInput = screen.getByTestId('file')
        fileInput.addEventListener('change', handleChangeFile)
        userEvent.upload(fileInput, file)
        expect(handleChangeFile).toHaveBeenCalled()
    
        await new Promise(process.nextTick)
    
        expect(console.error).toHaveBeenCalledWith(expect.any(Error))
    
        console.error.mockRestore()
      })
    })
  })
})

// test d'intégration POST
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to NewBill page", () => {
    test("Then it should show up the newbill page", () => {
      document.body.innerHTML = NewBillUI()
      expect(screen.getByText('Envoyer une note de frais')).toBeTruthy()
    })

    test('then I should be able to submit my bill', () => {
      jest.spyOn(console, 'error').mockImplementation(() => { })

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))

      const onNavigate = (pathname) => { document.body.innerHTML = ROUTES({ pathname }) }
      const newBill = new NewBill({ document, onNavigate, store: null, localStorage: window.localStorage })
      const handleSubmit = jest.fn(newBill.handleSubmit)
      newBill.updateBill = jest.fn()

      document.body.innerHTML = NewBillUI()
      const myBill = {
        type: "Hôtel et logement",
        name:  "Conférence",
        date:  "2024-02-04",
        amount: "650",
        vat: "80",
        pct: "20",
        commentary: "checking",
        fileUrl: "./mybillPicture.png",
        fileName: "mybillPicture.png",
        status: 'pending'
      }

      const newBillForm = screen.getByTestId('form-new-bill')
      screen.getByTestId('expense-type').value = myBill.type
      screen.getByTestId('expense-name').value = myBill.name
      screen.getByTestId('datepicker').value = myBill.date
      screen.getByTestId('amount').value = myBill.amount
      screen.getByTestId('vat').value = myBill.vat
      screen.getByTestId('pct').value = myBill.pct
      screen.getByTestId('commentary').value = myBill.commentary
      newBill.fileName = myBill.fileName
      newBill.fileUrl = myBill.fileUrl

      newBillForm.addEventListener("submit", handleSubmit)
      fireEvent.submit(newBillForm)
      expect(handleSubmit).toHaveBeenCalled()
      expect(newBill.updateBill).toHaveBeenCalled()

      expect(console.error).not.toBeCalled()
      console.error.mockRestore()
    })

    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills")

        Object.defineProperty( window, 'localStorage', { value: localStorageMock } )
        window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.append(root)
        router()
      })

      test("Then it should fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => { return { update : () =>  Promise.reject(new Error("Erreur 404")) }})

        document.body.innerHTML = BillsUI({ error: "Erreur 404" })
        await new Promise(process.nextTick)
        const message = await waitFor(() => screen.getByText(/Erreur 404/))
        expect(message).toBeTruthy()     
      })

      test("Then it should fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => { return { update : () =>  Promise.reject(new Error("Erreur 500")) }})

        document.body.innerHTML = BillsUI({ error: "Erreur 500" })
        await new Promise(process.nextTick)
        const message = await waitFor(() => screen.getByText(/Erreur 500/))
        expect(message).toBeTruthy()     
      })
    })
  })
})