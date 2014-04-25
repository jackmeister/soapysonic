"""
Selenium-based tests for library browsing features.
"""
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By

import unittest

# Credentials used for all testing
username = 'jack'
password = 'pass'

class TestLibraryBrowser(unittest.TestCase):

	def setUp(self):
		self.browser = webdriver.Firefox()
		self.browser.implicitly_wait(15)
		self.browser.get('http://localhost')
		self.browser.find_element_by_id('user').send_keys(username)
		self.browser.find_element_by_id('password').send_keys(password + Keys.RETURN)
		self.addCleanup(self.browser.quit)

	def testLoggedIn(self):
		assert self.browser.find_element_by_id('library-browser') is not None

	def testPageTitle(self):
		self.assertEquals('Music', self.browser.title)

	def testBrowseToArtist(self):
		self.browser.find_element_by_id('eef9ef2d-43aa-4e79-85d9-ef7d3bae6e36').click() #The Band
		assert self.browser.find_element(By.LINK_TEXT, 'Islands') is not None

	def testBrowseToAlbum(self):
		self.browser.find_element_by_id('eef9ef2d-43aa-4e79-85d9-ef7d3bae6e36').click() #The Band
		self.browser.find_element_by_id('66660f9c-968d-4a3a-98a3-1e98aa590373').click() #Islands
		assert self.browser.find_element(By.LINK_TEXT, 'Georgia On My Mind') is not None

	def testBackToLibrary(self):
		self.browser.find_element_by_id('eef9ef2d-43aa-4e79-85d9-ef7d3bae6e36').click() #The Band
		self.browser.find_element_by_id('66660f9c-968d-4a3a-98a3-1e98aa590373').click() #Islands
		self.browser.find_element_by_id('nav-library').click()
		assert self.browser.find_element(By.LINK_TEXT, 'The Band') is not None

	def testBackToArtist(self):
		self.browser.find_element_by_id('eef9ef2d-43aa-4e79-85d9-ef7d3bae6e36').click() #The Band
		self.browser.find_element_by_id('66660f9c-968d-4a3a-98a3-1e98aa590373').click() #Islands
		self.browser.find_element_by_id('nav-artist').click()
		assert self.browser.find_element(By.LINK_TEXT, 'Islands') is not None


if __name__ == '__main__':
	unittest.main(verbosity=2)