/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import { toHaveClass } from "@testing-library/jest-dom"
import userEvent from '@testing-library/user-event'
// import '@testing-library/jest-dom'
import Bills from "../containers/Bills.js"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store"
import router from "../app/Router.js"

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an Employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      // expect(windowIcon.classList.contains('active-icon')).toBe(true)
      expect(windowIcon).toHaveClass('active-icon')
    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    describe('When I click on the icon eye', () => {
      test('Then a modal should open', () => {
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
        document.body.innerHTML = BillsUI({ data: bills })
        const onNavigate = (pathname) => { document.body.innerHTML = ROUTES({ pathname })}
        const store = null
        const bill = new Bills({ document, onNavigate, store, localStorage: window.localStorage })
  
        $.fn.modal = jest.fn()
        const handleClickIconEye = jest.fn(() => bill.handleClickIconEye)
        const eye = screen.getAllByTestId('icon-eye')[0]   
        eye.addEventListener('click', handleClickIconEye)
        userEvent.click(eye)
        expect(handleClickIconEye).toHaveBeenCalled()
        const modale = screen.getByTestId('modaleFileEmployee')
        expect(modale).toBeTruthy()
      })
    })

    describe('When I click on the new bill button', () => {
      test('Then I should navigate to the new bill page', () => {
        document.body.innerHTML = BillsUI({ data: bills })
        const onNavigate = jest.fn()
        const bill = new Bills({ document, onNavigate, localStorage: window.localStorage })
    
        const newBillBtn = screen.getByTestId('btn-new-bill')
        userEvent.click(newBillBtn)
    
        expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['NewBill'])
      })
    })
  })
})


// test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills page", () => {
    test("Then it should fetches bills from mock API GET", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee" }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      const myBills = await waitFor(() => screen.getByText('Mes notes de frais'))
      expect(myBills).toBeTruthy()
    })

    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills")
        Object.defineProperty( window, 'localStorage', { value: localStorageMock } )
        window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.appendChild(root)
        router()
      })

      test("Then it should fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => { return { list : () =>  Promise.reject(new Error("Erreur 404")) }})
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick)
        const message = await waitFor(() => screen.getByText(/Erreur 404/))
        expect(message).toBeTruthy()
      })

      test("Then it should fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => { return { list : () =>  Promise.reject(new Error("Erreur 500")) }})
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick)
        const message = await waitFor(() => screen.getByText(/Erreur 500/))
        expect(message).toBeTruthy()
      })
    })
  })
})